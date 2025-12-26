import { NextResponse } from "next/server";

/**
 * DEPRECATED: Guest auth is now handled by zero-trust token authentication.
 * This route is disabled. Users are automatically authenticated via token
 * stored in localStorage and sent via x-privy-token header.
 *
 * See: lib/auth/token-auth.ts
 */
export async function GET(request: Request) {
  // Redirect to home - TokenProvider in layout.tsx handles auth
  return NextResponse.redirect(new URL("/", request.url));
}
