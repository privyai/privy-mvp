import "server-only";
import type { User } from "@/lib/db/schema";
import { getOrCreateTokenUser } from "@/lib/db/queries";
import { hashToken, isValidTokenFormat } from "./token";

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

    // Get or create user (idempotent)
    const user = await getOrCreateTokenUser(tokenHash);

    // Check token expiry (24 hours)
    const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    if (user.createdAt) {
      const tokenAge = Date.now() - new Date(user.createdAt).getTime();
      if (tokenAge > TOKEN_EXPIRY_MS) {
        console.warn(`Token expired for user ${user.id}`);
        return null;
      }
    }

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
