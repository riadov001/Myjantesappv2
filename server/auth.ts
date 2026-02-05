import { Router, Request, Response } from "express";
import { db } from "./db";
import { users, sessions } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const router = Router();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

async function getUserFromToken(token: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  return db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
}

async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
  sub: string;
} | null> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.email) return null;
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      sub: data.sub,
    };
  } catch (error) {
    console.error("Google token verification error:", error);
    return null;
  }
}

async function verifyFacebookToken(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
  id: string;
} | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.email) return null;
    return {
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
      id: data.id,
    };
  } catch (error) {
    console.error("Facebook token verification error:", error);
    return null;
  }
}

function formatUserResponse(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    role: user.role,
  };
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    
    const hashedPassword = await hashPassword(password);
    
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name: name || email.split("@")[0],
      authProvider: "email",
    }).returning();
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
});

router.post("/oauth/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: "Token Google requis" });
    }
    
    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      return res.status(401).json({ message: "Token Google invalide" });
    }
    
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.providerId, googleUser.sub),
        eq(users.email, googleUser.email)
      ),
    });
    
    if (user) {
      if (user.authProvider !== "google" || user.providerId !== googleUser.sub) {
        [user] = await db.update(users)
          .set({ 
            providerId: googleUser.sub, 
            authProvider: "google", 
            profileImage: googleUser.picture,
            name: user.name || googleUser.name,
          })
          .where(eq(users.id, user.id))
          .returning();
      }
    } else {
      [user] = await db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        profileImage: googleUser.picture,
        authProvider: "google",
        providerId: googleUser.sub,
      }).returning();
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification Google" });
  }
});

router.post("/oauth/facebook", async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ message: "Token Facebook requis" });
    }
    
    const facebookUser = await verifyFacebookToken(accessToken);
    if (!facebookUser) {
      return res.status(401).json({ message: "Token Facebook invalide" });
    }
    
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.providerId, facebookUser.id),
        eq(users.email, facebookUser.email)
      ),
    });
    
    if (user) {
      if (user.authProvider !== "facebook" || user.providerId !== facebookUser.id) {
        [user] = await db.update(users)
          .set({ 
            providerId: facebookUser.id, 
            authProvider: "facebook", 
            profileImage: facebookUser.picture,
            name: user.name || facebookUser.name,
          })
          .where(eq(users.id, user.id))
          .returning();
      }
    } else {
      [user] = await db.insert(users).values({
        email: facebookUser.email,
        name: facebookUser.name || facebookUser.email.split("@")[0],
        profileImage: facebookUser.picture,
        authProvider: "facebook",
        providerId: facebookUser.id,
      }).returning();
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification Facebook" });
  }
});

router.post("/oauth/apple", async (req: Request, res: Response) => {
  try {
    const { identityToken, user: appleUserId, email, fullName } = req.body;
    
    if (!appleUserId) {
      return res.status(400).json({ message: "Données Apple requises" });
    }
    
    const userEmail = email || `${appleUserId}@privaterelay.appleid.com`;
    const userName = fullName?.givenName 
      ? `${fullName.givenName} ${fullName.familyName || ''}`.trim()
      : undefined;
    
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.providerId, appleUserId),
        eq(users.email, userEmail)
      ),
    });
    
    if (user) {
      if (user.authProvider !== "apple" || user.providerId !== appleUserId) {
        [user] = await db.update(users)
          .set({ 
            providerId: appleUserId, 
            authProvider: "apple",
            name: user.name || userName,
          })
          .where(eq(users.id, user.id))
          .returning();
      }
    } else {
      [user] = await db.insert(users).values({
        email: userEmail,
        name: userName || userEmail.split("@")[0],
        authProvider: "apple",
        providerId: appleUserId,
      }).returning();
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Apple OAuth error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification Apple" });
  }
});

router.post("/oauth", async (req: Request, res: Response) => {
  try {
    const { provider, providerId, email, name, profileImage } = req.body;
    
    if (!provider || !providerId || !email) {
      return res.status(400).json({ message: "Données OAuth manquantes" });
    }
    
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.providerId, providerId),
        eq(users.email, email)
      ),
    });
    
    if (user) {
      [user] = await db.update(users)
        .set({ providerId, authProvider: provider, profileImage })
        .where(eq(users.id, user.id))
        .returning();
    } else {
      [user] = await db.insert(users).values({
        email,
        name: name || email.split("@")[0],
        profileImage,
        authProvider: provider,
        providerId,
      }).returning();
    }
    
    const token = await createSession(user.id);
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification OAuth" });
  }
});

router.get("/user", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ message: "Session expirée" });
    }
    
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.auth_token;
    
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    
    res.clearCookie("auth_token");
    res.json({ message: "Déconnecté" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
});

export default router;
