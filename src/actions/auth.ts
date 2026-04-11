"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prev: string | null, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Credenciales inválidas";
    }
    // signIn lanza un NEXT_REDIRECT cuando tiene éxito — hay que re-lanzarlo
    throw error;
  }
  return null;
}
