import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server (proxy to PWA backend)
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // For web, construct URL to backend port
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      const protocol = window.location.protocol;
      
      // In development (localhost), use the backend port directly
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:5000/';
      }
      
      // In Replit, access port 5000 via the same hostname
      return `${protocol}//${currentHost}:5000/`;
    }
    return '/';
  }

  // For native, we use the configured domain pointing to backend
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) {
    return 'http://localhost:5000/';
  }

  const url = host.startsWith('http') ? host : `https://${host}`;
  return url.endsWith('/') ? url : `${url}/`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  const url = new URL(cleanRoute, baseUrl);

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const route = queryKey.join("/");
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    const url = new URL(cleanRoute, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return null;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
