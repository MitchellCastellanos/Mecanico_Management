import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/api/book") ||
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/debug") ||
    pathname.startsWith("/api/version") ||
    pathname.startsWith("/api/webhooks");

  const isAdminApp =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login");

  const isPlatform = pathname === "/platform" || pathname.startsWith("/platform/");

  if (!req.auth) {
    if (isPublic) return NextResponse.next();
    if (isAdminApp || isPlatform) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
