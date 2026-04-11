import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Endpoint temporal de diagnóstico — borrar después del debug
export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_preview: process.env.DATABASE_URL?.replace(/:([^:@]{3})[^:@]*@/, ":***@").slice(0, 80),
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const userCount = await db.user.count();
    results.db_connected = true;
    results.user_count = userCount;

    if (userCount > 0) {
      const user = await db.user.findFirst({
        select: { email: true, role: true, passwordHash: true },
      });
      results.first_user_email = user?.email;
      results.first_user_role = user?.role;
      results.has_password_hash = !!user?.passwordHash;
      results.hash_prefix = user?.passwordHash?.slice(0, 7);
    }
  } catch (err) {
    results.db_connected = false;
    results.db_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
}
