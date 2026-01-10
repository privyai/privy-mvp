import { type NextRequest, NextResponse } from "next/server";

/**
 * Proxy middleware for the application.
 *
 * Authentication is now handled by:
 * - TokenProvider (client-side) - generates/stores tokens in localStorage
 * - authenticateToken (server-side) - validates tokens on API routes
 *
 * The middleware no longer needs to check authentication - API routes
 * handle their own auth via the x-privy-token header.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  /**
   * Logfire browser traces proxy
   * Forwards client-side traces to Logfire while adding the Authorization header
   * This prevents exposing the write token in the browser
   */
  if (pathname === "/client-traces" || pathname.startsWith("/client-traces/")) {
    const logfireToken = process.env.LOGFIRE_TOKEN;
    const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;

    if (!logfireToken || !tracesEndpoint) {
      console.error("Logfire not configured: missing LOGFIRE_TOKEN or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT");
      return new Response("Observability not configured", { status: 503 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Authorization", `Bearer ${logfireToken}`);

    return NextResponse.rewrite(new URL(tracesEndpoint), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // All routes are now public - API routes validate tokens themselves
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/client-traces/:path*",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
