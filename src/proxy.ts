import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Rutas públicas — no requieren sesión
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/debug") ||
    pathname.startsWith("/api/version") ||
    pathname.startsWith("/api/webhooks");

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protege todas las rutas excepto archivos estáticos y API pública
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
