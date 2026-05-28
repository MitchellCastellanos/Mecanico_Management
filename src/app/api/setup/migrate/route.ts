import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";

export const maxDuration = 60;

/**
 * Aplica prisma/initial-schema.sql una vez (desde Vercel, que suele alcanzar Supabase).
 * Header: x-setup-secret = CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sqlPath = join(process.cwd(), "prisma", "initial-schema.sql");
    const sql = readFileSync(sqlPath, "utf8");

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      await db.$executeRawUnsafe(statement);
    }

    return NextResponse.json({ ok: true, statements: statements.length });
  } catch (err) {
    console.error("[migrate]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
