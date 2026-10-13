import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// The public origin, inlined at build time. Don't build URLs from req.url:
// server.ts starts Next with hostname "localhost", so req.url is
// http://localhost:3000/... even behind the ALB.
function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function csrfCheck(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;

  const origin = req.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(appOrigin()).origin;
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
    const loginUrl = new URL("/login", appOrigin());
    loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// This file must live in src/ (next to app/). Next.js silently ignores a
// root-level middleware.ts in a src/ project; tests/unit/middleware.test.ts
// guards against it moving back.
export const config = {
  matcher: [
    "/",
    "/boards/:path*",
    "/api/boards/:path*",
    "/api/tasks/:path*",
    "/api/socket/:path*",
  ],
};
