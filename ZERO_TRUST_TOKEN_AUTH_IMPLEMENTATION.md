# Zero-Trust Token Authentication Implementation Guide

## Overview

This implementation replaces the NextAuth guest system with a zero-trust token-based authentication system where:
- Users get a random 64-character token on first visit
- Server only stores SHA-256 hash of tokens (never the token itself)
- Lose token = lose access (by design, not a bug)
- No email, no password, true anonymity

## What Was Implemented

### 1. Token Utilities (`lib/auth/`)
- **token.ts**: Server-side token hashing and validation
- **token-client.ts**: Client-side token generation and storage
- **token-auth.ts**: Server-side authentication middleware

### 2. Database Changes (`lib/db/`)
- **schema.ts**: Added `tokenHash`, `createdAt`, `lastActiveAt` to User table
- **queries.ts**: New functions:
  - `getUserByTokenHash()`
  - `createTokenUser()`
  - `getOrCreateTokenUser()`
  - `burnUserByTokenHash()`

### 3. Client Components (`components/`)
- **token-display.tsx**: First-time token display modal
- **import-token.tsx**: Token import dialog
- **token-provider.tsx**: Wrapper component for token management

### 4. React Hook (`hooks/`)
- **use-token.ts**: Token management hook

### 5. API Client (`lib/`)
- **api-client.ts**: Authenticated fetch wrapper with token headers

### 6. Updated API Routes
- **app/(chat)/api/chat/route.ts**: Replaced NextAuth with token auth
  - Removed geolocation tracking for privacy
  - Hash user IDs before logging

## Migration Steps

### 1. Database Migration

Run these SQL commands to update your existing database:

```sql
-- Add new columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tokenHash" VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP,
  ALTER COLUMN "email" DROP NOT NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_token_hash ON "User"("tokenHash");
```

Or use Drizzle:

```bash
pnpm db:push
```

### 2. Update Your Layout

Wrap your app with the TokenProvider:

```tsx
// app/layout.tsx
import { TokenProvider } from "@/components/token-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TokenProvider>
          {children}
        </TokenProvider>
      </body>
    </html>
  );
}
```

### 3. Update API Calls

Replace all `fetch` calls with the authenticated client:

**Before:**
```tsx
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify(data),
});
```

**After:**
```tsx
import { apiClient } from "@/lib/api-client";

const response = await apiClient.post("/api/chat", data);
```

### 4. Update Other API Routes

Apply the same pattern to other API routes:

```tsx
import { authenticateToken } from "@/lib/auth/token-auth";

export async function POST(request: Request) {
  const user = await authenticateToken(request);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Use user.id for queries
  // ...
}
```

### 5. Add Token Import to Sidebar/Header

Add the import token button somewhere visible:

```tsx
import { ImportToken } from "@/components/import-token";
import { useToken } from "@/hooks/use-token";

function Header() {
  const { importToken } = useToken();

  return (
    <header>
      {/* ... other header items ... */}
      <ImportToken onImport={importToken} />
    </header>
  );
}
```

## Privacy Improvements Included

1. **No geolocation tracking** - Removed Vercel geolocation
2. **Hashed user IDs in logs** - User IDs are hashed before logging
3. **Minimal PII** - No emails stored for token users
4. **Zero-knowledge** - Server can't recover lost tokens

## User Experience Flow

### First-Time User

1. User visits Privy
2. Token is generated client-side and stored in localStorage
3. Modal shows token with copy/download options
4. User must acknowledge they've saved it before continuing
5. User can now use Privy normally

### Returning User

1. Token is auto-loaded from localStorage
2. Requests include `x-privy-token` header
3. Server validates and gets/creates user
4. Seamless experience

### Lost Token

1. User can click "Import Token"
2. Paste their saved token
3. Access restored immediately
4. Previous token's chats are no longer accessible (unless they save both)

## Testing

### Test First-Time Flow

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Should see token display modal
4. Copy token and acknowledge
5. Should proceed to app

### Test Token Import

1. Save your current token
2. Clear localStorage
3. Refresh (get new token)
4. Click "Import Token"
5. Paste saved token
6. Should restore access to old chats

### Test API Authentication

```bash
# Get your token from localStorage
TOKEN="your-64-char-token-here"

# Test API call
curl -X POST http://localhost:3000/api/chat \
  -H "x-privy-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "message": {...}}'
```

## Backwards Compatibility

The current implementation maintains backward compatibility:
- Old `email` and `password` fields still exist
- Can migrate existing users by generating tokens for them
- Both auth systems can coexist temporarily

To fully migrate existing users:

```sql
-- Generate tokens for existing users (optional)
UPDATE "User"
SET "tokenHash" = md5(random()::text || clock_timestamp()::text)
WHERE "tokenHash" IS NULL;
```

## Security Considerations

### Token Storage
- Tokens are stored in localStorage (client-side only)
- Consider offering backup to password managers
- Future: Add option to encrypt localStorage

### Token Transmission
- Tokens sent in HTTP headers (not URL)
- HTTPS required in production
- Token never logged server-side

### Token Loss
- Permanent by design
- User education is critical
- Consider optional recovery mechanism for Premium tier

## Future Enhancements

### Priority 1 (Next Sprint)
- [ ] Add QR code export for mobile transfer
- [ ] Token expiration (optional, for extra security)
- [ ] Multiple devices support (link tokens)

### Priority 2 (Later)
- [ ] Hardware key support (YubiKey, etc.)
- [ ] Biometric unlock (Face ID/Touch ID)
- [ ] Social recovery (3-of-5 friends)

### Priority 3 (Research)
- [ ] Fully client-side encryption of messages
- [ ] Zero-knowledge proofs for deletion
- [ ] Decentralized identity (DID) integration

## Troubleshooting

### "No authentication token found"
- User's localStorage was cleared
- Need to import token or start fresh

### "Unauthorized: Valid token required"
- Token format invalid (not 64 hex chars)
- Token not in database (new token or lost)
- Check browser console for token value

### Token not persisting
- Check localStorage permissions
- Incognito mode clears on close
- Browser extensions may interfere

### Database errors
- Run `pnpm db:push` to update schema
- Check PostgreSQL is running
- Verify POSTGRES_URL in .env.local

## Rollback Plan

If you need to rollback:

1. Keep the old auth files:
```bash
git checkout main -- app/(auth)/auth.ts
git checkout main -- app/(auth)/auth.config.ts
```

2. Revert API route changes:
```bash
git checkout main -- app/(chat)/api/chat/route.ts
```

3. Remove token columns (optional):
```sql
ALTER TABLE "User"
  DROP COLUMN "tokenHash",
  DROP COLUMN "createdAt",
  DROP COLUMN "lastActiveAt";
```

## Questions?

- Check the code comments in `lib/auth/token.ts`
- Review `PRIVACY_ARCHITECTURE_ANALYSIS.md` for design rationale
- Test with `pnpm dev` and inspect network tab

---

**Implementation Date**: 2025-12-21
**Status**: Ready for testing
**Next Steps**: Database migration → Testing → Deploy
