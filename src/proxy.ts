import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mended_session";

/** Paths anyone may open without signing in. */
const PUBLIC_PREFIXES = ["/login", "/auth/", "/join/", "/api/test/"];

/**
 * Optimistic check only: sends visitors without a session cookie to sign in before rendering.
 * Every page, action and route still verifies the session itself.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except Next internals, static files, and PWA assets.
    "/((?!_next/|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|.*\\.(?:png|svg|jpg|webp|ico|txt)$).*)",
  ],
};
