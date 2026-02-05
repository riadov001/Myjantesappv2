import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

const BACKEND_URL = process.env.BACKEND_URL || "https://myjantes.mytoolsgroup.eu";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all /api/* requests to the external backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      secure: true,
      cookieDomainRewrite: "",
      on: {
        proxyReq: (proxyReq, req, res) => {
          // Forward cookies and headers
          if (req.headers.cookie) {
            proxyReq.setHeader("Cookie", req.headers.cookie);
          }
        },
        proxyRes: (proxyRes, req, res) => {
          // Allow credentials
          proxyRes.headers["access-control-allow-credentials"] = "true";
        },
        error: (err, req, res) => {
          console.error("Proxy error:", err);
          if (res && typeof res.writeHead === 'function') {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Backend unavailable" }));
          }
        },
      },
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}
