/**
 * Client-side token management utilities
 * Handles localStorage, token generation UI, etc.
 */

const TOKEN_STORAGE_KEY = "privy_access_token";
const TOKEN_SEEN_KEY = "privy_token_seen"; // Has user seen their token?
const TOKEN_EXISTS_KEY = "privy_has_token"; // Persistent flag in localStorage
const TOKEN_LAST_ACTIVITY_KEY = "privy_last_activity"; // Last activity timestamp
const TOKEN_CREATED_KEY = "privy_token_created"; // Token creation timestamp

// Session grace period - if user returns within this time, no re-auth needed
const SESSION_GRACE_PERIOD_MS = 150 * 1000; // 150 seconds

// Free tier token expiry - 24 hours
const FREE_TIER_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure token in the browser
 */
export function generateTokenClient(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Store token in sessionStorage (clears on browser close)
 */
export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  // Mark in localStorage that user has a token (persists across sessions)
  localStorage.setItem(TOKEN_EXISTS_KEY, "true");
  // Record creation time for expiry checks
  localStorage.setItem(TOKEN_CREATED_KEY, Date.now().toString());
  // Update last activity
  updateLastActivity();
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_LAST_ACTIVITY_KEY, Date.now().toString());
}

/**
 * Check if within session grace period (150 seconds)
 */
export function isWithinGracePeriod(): boolean {
  if (typeof window === "undefined") return false;
  const lastActivity = localStorage.getItem(TOKEN_LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;

  const elapsed = Date.now() - parseInt(lastActivity, 10);
  return elapsed < SESSION_GRACE_PERIOD_MS;
}

/**
 * Check if free tier token has expired (24 hours)
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return false;
  const created = localStorage.getItem(TOKEN_CREATED_KEY);
  if (!created) return true; // No creation time = treat as expired

  const elapsed = Date.now() - parseInt(created, 10);
  return elapsed > FREE_TIER_EXPIRY_MS;
}

/**
 * Get token age in milliseconds
 */
export function getTokenAge(): number {
  if (typeof window === "undefined") return 0;
  const created = localStorage.getItem(TOKEN_CREATED_KEY);
  if (!created) return Infinity;
  return Date.now() - parseInt(created, 10);
}

/**
 * Retrieve token from sessionStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Clear token from sessionStorage and localStorage (burn/logout)
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_SEEN_KEY);
  localStorage.removeItem(TOKEN_EXISTS_KEY);
  localStorage.removeItem(TOKEN_LAST_ACTIVITY_KEY);
  localStorage.removeItem(TOKEN_CREATED_KEY);
}

/**
 * Check if user has acknowledged seeing their token
 */
export function hasSeenToken(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOKEN_SEEN_KEY) === "true";
}

/**
 * Check if user is a returning user (has created a token before)
 */
export function isReturningUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOKEN_EXISTS_KEY) === "true";
}

/**
 * Mark that user has seen their token
 */
export function markTokenAsSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_SEEN_KEY, "true");
}

/**
 * Get or create token (idempotent)
 */
export function getOrCreateToken(): string {
  let token = getStoredToken();

  if (!token) {
    token = generateTokenClient();
    storeToken(token);
  }

  return token;
}

/**
 * Format token for display (8-character chunks)
 */
export function formatTokenForDisplay(token: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += 8) {
    chunks.push(token.substring(i, i + 8));
  }
  return chunks;
}

/**
 * Copy token to clipboard
 */
export async function copyTokenToClipboard(token: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(token);
    return true;
  } catch (err) {
    console.error("Failed to copy token:", err);
    return false;
  }
}

/**
 * Download token as text file
 */
export function downloadTokenAsFile(token: string): void {
  const blob = new Blob([token], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `privy-token-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate QR code data URL for token
 */
export function getTokenQRCodeUrl(token: string): string {
  // Using a simple data URL approach
  // In production, you might want to use a QR code library
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(token)}`;
}

/**
 * Validate token format (client-side check)
 */
export function isValidTokenFormat(token: string): boolean {
  const hexRegex = /^[a-f0-9]{64}$/i;
  return hexRegex.test(token);
}

/**
 * Import token from user input (sanitize)
 */
export function importToken(input: string): string | null {
  // Remove all whitespace, newlines, etc.
  const cleaned = input.replace(/\s+/g, "").toLowerCase();

  if (!isValidTokenFormat(cleaned)) {
    return null;
  }

  return cleaned;
}
