"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(_prev: string | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return "Ingresa tu email y contraseña";
  }

  // Step 1: Verify credentials against DB directly
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return "Email o contraseña incorrectos";
    }
  } catch (err) {
    console.error("[loginAction] db error:", err);
    return "Error de conexión. Intenta de nuevo.";
  }

  // Step 2: Credentials verified — create NextAuth session without auto-redirect
  // redirect: false prevents NextAuth from calling Next.js redirect() internally
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    console.error("[loginAction] signIn session error:", err);
    return "Error al crear la sesión. Intenta de nuevo.";
  }

  redirect("/dashboard");
}
