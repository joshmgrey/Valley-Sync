import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Let the auth endpoints through unconditionally
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  if (!isLoggedIn) {
    // API routes return 401 so clients can handle it programmatically
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Pages redirect to login
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
