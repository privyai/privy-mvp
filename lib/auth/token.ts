import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Zero-Trust Token Authentication for Privy
 *
 * Philosophy:
 * - No email, no password, no PII
 * - Server only stores hash(token), never the token itself
 * - Lose token = lose access (feature, not bug)
 * - True anonymity by design
 */

export const TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters
export const TOKEN_FORMAT = "hex" as const;

/**
 * Generate a cryptographically secure random token
 * This happens CLIENT-SIDE ONLY
 */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString(TOKEN_FORMAT);
}

/**
 * Hash a token using SHA-256
 * This creates a one-way hash that can be safely stored in the database
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Hash an IP address with a secret salt
 * Uses SHA-256 for privacy (original IP is never stored)
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT;

  // Enforce IP_SALT in production for security
  if (!salt && process.env.NODE_ENV === "production") {
    throw new Error(
      "IP_SALT environment variable is required in production. " +
      "Generate one with: openssl rand -base64 32"
    );
  }

  // Use default salt only in development/testing
  const effectiveSalt = salt || "privy-default-salt-change-in-prod";

  return createHash("sha256")
    .update(`${ip}:${effectiveSalt}`)
    .digest("hex");
}

/**
 * Validate token format (client and server side)
 */
export function isValidTokenFormat(token: string): boolean {
  // Must be 64 hex characters
  const hexRegex = /^[a-f0-9]{64}$/i;
  return hexRegex.test(token);
}

/**
 * Generate a human-readable token ID (first 8 chars)
 * Used for displaying "Token ending in abc123..."
 */
export function getTokenId(token: string): string {
  return token.substring(0, 8);
}

/**
 * Create a backup phrase from token (for user to write down)
 * Splits token into 8-character chunks for easier copying
 */
export function formatTokenForDisplay(token: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += 8) {
    chunks.push(token.substring(i, i + 8));
  }
  return chunks;
}

/**
 * Parse a token from display format (remove spaces, newlines)
 */
export function parseTokenFromInput(input: string): string {
  return input.replace(/\s+/g, "").toLowerCase();
}

/**
 * Verify token matches hash (constant-time comparison)
 */
export function verifyToken(token: string, tokenHash: string): boolean {
  const computedHash = hashToken(token);

  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== tokenHash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ tokenHash.charCodeAt(i);
  }

  return result === 0;
}
