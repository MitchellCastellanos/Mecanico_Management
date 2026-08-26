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
      // Reconstruye el origen desde los headers de la petición real, no desde
      // req.url/req.nextUrl: con varios dominios apuntando al mismo proyecto de
      // Vercel (dominio propio + alias .vercel.app), ese origen puede resolver
      // a un host distinto al que el navegador realmente pidió y mandar el
      // redirect a un dominio equivocado.
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      const protocol = req.headers.get("x-forwarded-proto") ?? "https";
      const origin = host ? `${protocol}://${host}` : req.nextUrl.origin;
      const loginUrl = new URL("/admin/login", origin);
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
