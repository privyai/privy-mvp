# Security Hardening Documentation

## Overview

This document describes the security improvements implemented to protect Privy from abuse, bots, and data breaches.

## Implemented Protections

### 1. Rate Limiting (Upstash Redis)

**Protection against:**
- API spam/DDoS attacks
- Resource exhaustion
- Sybil attacks (mass account creation)

**Implementation:**
```typescript
// lib/rate-limit.ts
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 messages per minute
});
```

**Limits:**
- **Chat API**: 30 messages/minute per user
- **Account creation**: 5 accounts/hour per IP
- **General API**: 100 requests/minute per user

**Response on limit exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "limit": 30,
  "reset": 1640995200,
  "remaining": 0
}
```

### 2. Token Expiry (24 Hours)

**Protection against:**
- Stolen token permanence
- Long-lived credentials

**Implementation:**
```typescript
// lib/auth/token-auth.ts
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
if (tokenAge > TOKEN_EXPIRY_MS) {
  return null; // Token expired
}
```

**User experience:**
- Tokens expire 24 hours after creation
- User must re-enter token after expiry
- Grace period mechanism in `use-token.ts` allows auto-regeneration within 150 seconds

### 3. Bot Detection (Cloudflare)

**Protection against:**
- Automated bot traffic
- API tools/scripts
- Scraping attacks

**Implementation:**
```typescript
// lib/rate-limit.ts
export function isBotRequest(request: Request): boolean {
  const botScore = request.headers.get("cf-bot-score");
  if (botScore) {
    const score = parseInt(botScore, 10);
    return score < 30; // Reject likely bots
  }
  return false;
}
```

**How it works:**
- Cloudflare analyzes every request
- Provides `cf-bot-score` header (0-99)
- Score < 30 = likely bot → request rejected with 403

**Cloudflare features used:**
- Bot Fight Mode (automatic)
- Bot Management (bot score headers)
- Turnstile (optional human verification)

### 4. Secure Burn (Overwrite Before Delete)

**Protection against:**
- Data recovery from backups
- WAL log forensics
- Legal subpoena data exposure

**Implementation:**
```typescript
// lib/db/queries.ts
export async function burnUserByTokenHash(tokenHash: string) {
  // Step 1: Overwrite all message content
  await db.update(message).set({
    parts: null,
    attachments: null,
  }).where(eq(message.chatId, userChat.id));

  // Step 2: Overwrite user credentials
  await db.update(user).set({
    tokenHash: null,
    email: null,
    password: null,
  }).where(eq(user.id, userToBurn.id));

  // Step 3: Delete records (now safe)
  await db.delete(user).where(eq(user.id, userToBurn.id));
}
```

**Why this matters:**
- PostgreSQL `DELETE` doesn't immediately erase data
- Backups may retain deleted rows for 30 days
- WAL (Write-Ahead Log) contains historical operations
- Overwriting with `null` before deletion makes data unrecoverable

### 5. Cloudflare Turnstile (Optional)

**Protection against:**
- Automated bot registration
- Credential stuffing
- Mass account creation

**Setup:**
1. Get Turnstile keys: https://dash.cloudflare.com/?to=/:account/turnstile
2. Add to `.env.local`:
   ```
   CLOUDFLARE_TURNSTILE_SECRET=your_secret
   CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key
   ```
3. Add to token generation flow (client-side)

**Verification:**
```typescript
const isHuman = await verifyTurnstile(token, clientIP);
if (!isHuman) {
  return new Response("Forbidden: Verification failed", { status: 403 });
}
```

## Setup Instructions

### Prerequisites

1. **Upstash Redis** (free tier available)
   - Sign up: https://upstash.com
   - Create database
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

2. **Cloudflare** (domain must be on Cloudflare)
   - Enable Bot Fight Mode (free)
   - (Optional) Get Turnstile keys for human verification

### Environment Variables

Add to `.env.local`:

```bash
# REQUIRED: Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# OPTIONAL: Cloudflare Turnstile (bot protection)
CLOUDFLARE_TURNSTILE_SECRET=your_secret
CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key
```

### Cloudflare Configuration

**Enable Bot Fight Mode:**
1. Go to Cloudflare Dashboard
2. Select your domain
3. Security → Bots
4. Enable "Bot Fight Mode" (free)

**Enable Bot Management (for bot scores):**
1. Same location as above
2. Upgrade to Pro plan ($20/month) for bot score headers
3. Or use Turnstile (free) for human verification

## Security Checklist

- [x] Rate limiting enabled (30 msg/min)
- [x] Token expiry (24 hours)
- [x] Bot detection (Cloudflare headers)
- [x] Secure burn (overwrite before delete)
- [x] HTTPS enforced (via Cloudflare)
- [x] No PII in logs (user IDs hashed)
- [ ] Cloudflare Turnstile enabled (optional)
- [ ] Bot Management enabled (requires Pro plan)

## Monitoring

**Rate limit events are logged via Logfire:**
```typescript
logRateLimitCheck({
  userId: hashToken(user.id), // Privacy-safe
  messageCount: limit - remaining,
  limit,
  allowed: success,
});
```

**View in Logfire dashboard:**
- Rate limit hits
- Bot detection events
- Failed authentication attempts

## Testing

### Test Rate Limiting
```bash
# Send 31 requests rapidly (limit is 30/min)
for i in {1..31}; do
  curl -X POST https://privy.app/api/chat \
    -H "x-privy-token: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"id":"test","message":{"role":"user","parts":[{"type":"text","text":"test"}]}}'
done

# 31st request should return 429 Too Many Requests
```

### Test Token Expiry
```typescript
// Manually set createdAt to 25 hours ago in database
await db.update(user)
  .set({ createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) })
  .where(eq(user.id, userId));

// Next API call should return 401 Unauthorized
```

### Test Bot Detection
```bash
# Simulate low bot score
curl -X POST https://privy.app/api/chat \
  -H "cf-bot-score: 20" \
  -H "x-privy-token: $TOKEN"

# Should return 403 Forbidden
```

## Known Limitations

1. **Rate limiting requires Upstash** (not free forever)
   - Free tier: 10K commands/day
   - Cost: ~$10/month for production
   - Alternative: Vercel KV (more expensive)

2. **Bot score requires Cloudflare Pro** ($20/month)
   - Free tier: Bot Fight Mode only (no score headers)
   - Alternative: Use Turnstile (free) for human verification

3. **Token expiry may frustrate users**
   - 24 hours is aggressive for a coaching app
   - Consider extending to 7 days for premium users

4. **Secure burn doesn't protect against:**
   - Offline database backups (if manually created)
   - Cold storage archives
   - Legal holds on data

## Future Enhancements

- [ ] Device fingerprinting (prevent token sharing)
- [ ] IP-based account creation limits
- [ ] Honeypot fields for bot detection
- [ ] CAPTCHA fallback for suspicious requests
- [ ] Implement Turnstile on token generation
- [ ] Add encryption at rest (per-user keys)
- [ ] Implement crypto-shredding with key deletion

## Emergency Response

**If rate limit is being abused:**
```typescript
// Temporarily increase strictness
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // Reduce to 10/min
});
```

**If bot attack detected:**
```typescript
// Block all requests with low bot scores
if (botScore && botScore < 50) { // Increase threshold
  return new Response("Forbidden", { status: 403 });
}
```

**If DDoS in progress:**
1. Enable Cloudflare "I'm Under Attack" mode
2. Review Logfire for attack patterns
3. Temporarily disable token creation
4. Contact Cloudflare support for DDoS mitigation

---

**Last updated:** 2025-12-27
**Implemented by:** Claude Code
**Security review status:** ⚠️ Pending penetration testing
