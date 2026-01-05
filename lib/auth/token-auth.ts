import "server-only";
import type { User } from "@/lib/db/schema";
import { getOrCreateTokenUser } from "@/lib/db/queries";
import { hashToken, hashIp, isValidTokenFormat } from "./token";

/**
 * Server-side token authentication
 */

export const TOKEN_HEADER = "x-privy-token";

/**
 * Extract token from request headers
 */
export function getTokenFromRequest(request: Request): string | null {
  const token = request.headers.get(TOKEN_HEADER);

  if (!token) {
    return null;
  }

  // Validate format before proceeding
  if (!isValidTokenFormat(token)) {
    return null;
  }

  return token;
}

/**
 * Authenticate a request using token
 * Returns the user if valid, null otherwise
 */
export async function authenticateToken(
  request: Request
): Promise<User | null> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    // Hash the token
    const tokenHash = hashToken(token);

    // Extract IP for rate limiting new account creation
    // NOTE: This relies on Vercel's proxy to set x-forwarded-for correctly.
    // The first IP in the chain is the client IP. While this can technically
    // be spoofed if the proxy is misconfigured, Vercel strips client-provided
    // forwarding headers, making this reasonably secure for best-effort rate limiting.
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    let ip = "127.0.0.1"; // Default fallback

    if (forwarded) {
      // Take the first IP in the chain and trim whitespace
      ip = forwarded.split(",")[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    }

    const ipHash = hashIp(ip);

    // Get or create user (idempotent, with IP rate limiting)
    const user = await getOrCreateTokenUser(tokenHash, ipHash);

    return user;
  } catch (error) {
    console.error("Token authentication error:", error);
    return null;
  }
}

/**
 * Require authentication - throw if not authenticated
 */
export async function requireAuth(request: Request): Promise<User> {
  const user = await authenticateToken(request);

  if (!user) {
    throw new Error("Unauthorized: Valid token required");
  }

  return user;
}

/**
 * Get user ID from token (without full user lookup)
 * Useful for logging/analytics where we don't need full user object
 */
export async function getUserIdFromToken(
  request: Request
): Promise<string | null> {
  const user = await authenticateToken(request);
  return user?.id || null;
}
