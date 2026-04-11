"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prev: string | null, formData: FormData) {
  const email = formData.get("email") as string;
  console.log("[loginAction] called for:", email);

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return `SA_ERROR: ${error.type}`;
    }
    throw error;
  }
  return "SA_SUCCESS_NO_REDIRECT";
}
