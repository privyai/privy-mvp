import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different endpoints
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 messages per minute
  analytics: true,
  prefix: "ratelimit:chat",
});

export const accountCreationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 accounts per hour per IP
  analytics: true,
  prefix: "ratelimit:account",
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 API calls per minute
  analytics: true,
  prefix: "ratelimit:api",
});

/**
 * Get client IP from request (works with Cloudflare)
 */
export function getClientIP(request: Request): string {
  // Cloudflare provides CF-Connecting-IP header
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Fallback to x-forwarded-for
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  // Fallback to x-real-ip
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

/**
 * Check if request is from a bot (using Cloudflare bot score)
 */
export function isBotRequest(request: Request): boolean {
  // Cloudflare Bot Management provides a bot score (0-99)
  // Lower score = more likely to be a bot
  const botScore = request.headers.get("cf-bot-score");

  if (botScore) {
    const score = parseInt(botScore, 10);
    // Reject if bot score is below 30 (likely bot)
    return score < 30;
  }

  return false;
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.CLOUDFLARE_TURNSTILE_SECRET) {
    console.warn("Turnstile secret not configured, skipping verification");
    return true; // Allow in development
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
          response: token,
          remoteip: ip,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
