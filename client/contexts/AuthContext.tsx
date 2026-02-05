import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '@/types';
import { getApiUrl } from '@/lib/query-client';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isGoogleConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@myjantes_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const isGoogleConfigured = !!googleClientId;

  const [, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest(
    isGoogleConfigured ? {
      clientId: googleClientId,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    } : { clientId: '' }
  );

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/user`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const userData = await response.json();
          if (userData && userData.id) {
            return userData;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }, []);

  const handleAuthResponse = async (data: any): Promise<{ success: boolean; error?: string }> => {
    if (data && data.id) {
      setUser(data);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      return { success: true };
    }
    return { success: false, error: data?.message || 'Erreur d\'authentification' };
  };

  const refreshUser = useCallback(async () => {
    const userData = await fetchUser();
    setUser(userData);
    if (userData) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [fetchUser]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        } else {
          setUser(null);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchUser]);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type === 'success') {
        const { id_token } = googleResponse.params;
        if (id_token) {
          try {
            const baseUrl = getApiUrl();
            const response = await fetch(`${baseUrl}api/auth/oauth/google`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: id_token }),
            });
            const data = await response.json();
            await handleAuthResponse(data);
          } catch (error) {
            console.error('Google auth error:', error);
          }
        }
      }
    };
    handleGoogleResponse();
  }, [googleResponse]);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return handleAuthResponse(data);
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      return handleAuthResponse(data);
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: "Erreur lors de l'inscription" };
    }
  };

  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Apple Sign-In non disponible sur web' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/auth/oauth/apple`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        }),
      });

      const data = await response.json();
      return handleAuthResponse(data);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Connexion annulée' };
      }
      console.error('Apple login error:', error);
      return { success: false, error: 'Erreur Apple Sign-In' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isGoogleConfigured) {
      return { success: false, error: 'Google Sign-In non configuré. Veuillez ajouter EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.' };
    }
    
    try {
      const result = await googlePromptAsync();
      if (result.type === 'success') {
        return { success: true };
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, error: 'Connexion annulée' };
      }
      return { success: false, error: 'Erreur Google Sign-In' };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Erreur Google Sign-In' };
    }
  };

  const logout = async () => {
    try {
      const baseUrl = getApiUrl();
      await fetch(`${baseUrl}api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithEmail,
        register,
        loginWithApple,
        loginWithGoogle,
        logout,
        refreshUser,
        isGoogleConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
