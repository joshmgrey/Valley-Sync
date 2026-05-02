import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfCheck(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;

  const origin = req.headers.get("origin");
  if (!origin) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Auth endpoints must be public for the OAuth callback to work
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // CSRF: reject cross-origin mutation requests
  if (!csrfCheck(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/boards/:path*",
    "/api/boards/:path*",
    "/api/tasks/:path*",
    "/api/socket/:path*",
  ],
};
