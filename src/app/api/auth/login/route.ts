import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

// Build tag injected at build time so the login page can show which version is live
export const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? Date.now().toString(36);

function loginRedirect(req: NextRequest, error: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  let email: string;
  let password: string;
  let callbackUrl: string;

  // Accept both form submissions and JSON (for API clients)
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
    password = (formData.get("password") as string) ?? "";
    callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
  } else {
    const body = await req.json().catch(() => ({}));
    email = (body.email ?? "").trim().toLowerCase();
    password = body.password ?? "";
    callbackUrl = body.callbackUrl || "/dashboard";
  }

  const isFormRequest = contentType.includes("form");

  if (!email || !password) {
    if (isFormRequest) return loginRedirect(req, "Ingresa tu email y contraseña");
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  // Step 1: Verify credentials against the database
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      if (isFormRequest) return loginRedirect(req, "Email o contraseña incorrectos");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      if (isFormRequest) return loginRedirect(req, "Email o contraseña incorrectos");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
  } catch (err) {
    console.error("[/api/auth/login] db error:", err);
    if (isFormRequest) return loginRedirect(req, "Error de conexión. Intenta de nuevo.");
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }

  // Step 2: Credentials verified — create the NextAuth session cookie
  // redirect:false prevents NextAuth from calling Next.js redirect() internally
  try {
    await signIn("credentials", { email, password, redirect: false, redirectTo: callbackUrl });
  } catch (err) {
    console.error("[/api/auth/login] signIn error:", err);
    if (isFormRequest) return loginRedirect(req, "Error al crear la sesión. Intenta de nuevo.");
    return NextResponse.json({ error: "Error de sesión" }, { status: 500 });
  }

  // Step 3: Session cookie is now set — redirect to dashboard
  if (isFormRequest) {
    return NextResponse.redirect(new URL(callbackUrl, req.url), { status: 303 });
  }
  return NextResponse.json({ ok: true });
}
