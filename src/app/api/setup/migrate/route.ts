import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { runIncrementalMigrate, getLatestSchemaVersion } from "@/lib/incremental-migrate";
import { db } from "@/lib/db";

export const maxDuration = 60;

/**
 * Aplica migraciones SQL en producción (Supabase).
 * Header: x-setup-secret = CRON_SECRET
 *
 * POST (default): migración incremental (language, lastName, taxRate).
 * POST ?full=1: initial-schema.sql (solo instalación nueva).
 */
function parseStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const full = req.nextUrl.searchParams.get("full") === "1";

  try {
    if (full) {
      const sqlPath = join(process.cwd(), "prisma", "initial-schema.sql");
      const statements = parseStatements(readFileSync(sqlPath, "utf8"));
      for (const statement of statements) {
        await db.$executeRawUnsafe(statement);
      }
      return NextResponse.json({ ok: true, file: "initial-schema.sql", statements: statements.length });
    }

    const count = await runIncrementalMigrate();
    const dbVersion = await getLatestSchemaVersion();
    return NextResponse.json({
      ok: true,
      file: "incremental-migrate",
      statements: count,
      schema_version: dbVersion,
    });
  } catch (err) {
    console.error("[migrate]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
