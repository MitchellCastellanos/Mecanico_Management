import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    // Validate credentials directly
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, shopId: true, role: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Credentials are valid — use NextAuth signIn to create the session cookie
    await signIn("credentials", { email, password, redirect: false });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
