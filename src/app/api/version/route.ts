import { NextResponse } from "next/server";
import { SCHEMA_VERSION, getLatestSchemaVersion } from "@/lib/incremental-migrate";

export async function GET() {
  const dbVersion = await getLatestSchemaVersion().catch(() => null);

  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    commit_short: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    env: process.env.NODE_ENV,
    deployed_at: new Date().toISOString(),
    schema_version_expected: SCHEMA_VERSION,
    schema_version_db: dbVersion,
    schema_ok: dbVersion === SCHEMA_VERSION,
  });
}
