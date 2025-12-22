"use client";

import { getStoredToken } from "@/lib/auth/token-client";

/**
 * HTTP client wrapper that automatically adds authentication token
 */

const TOKEN_HEADER = "x-privy-token";

/**
 * Enhanced fetch that includes authentication token
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getStoredToken();

  if (!token) {
    throw new Error("No authentication token found. Please refresh the page.");
  }

  const headers = new Headers(init?.headers);
  headers.set(TOKEN_HEADER, token);

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Convenience methods for common HTTP operations
 */
export const apiClient = {
  get: async (url: string, init?: RequestInit) => {
    return authenticatedFetch(url, {
      ...init,
      method: "GET",
    });
  },

  post: async (url: string, body?: any, init?: RequestInit) => {
    return authenticatedFetch(url, {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: async (url: string, body?: any, init?: RequestInit) => {
    return authenticatedFetch(url, {
      ...init,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: async (url: string, init?: RequestInit) => {
    return authenticatedFetch(url, {
      ...init,
      method: "DELETE",
    });
  },
};

/**
 * Get headers for authenticated requests
 * Use this when you need to pass headers directly (e.g., to other libraries)
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();

  if (!token) {
    return {};
  }

  return {
    [TOKEN_HEADER]: token,
  };
}
