import { NextRequest, NextResponse } from "next/server";

// Setup endpoint — only callable with CRON_SECRET header, and only does anything
// if no users exist yet. Safe to leave deployed but call it once after first deploy.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@/lib/db");
  const userCount = await db.user.count().catch(() => -1);

  if (userCount > 0) {
    return NextResponse.json({ message: "Ya configurado", users: userCount });
  }

  return NextResponse.json({
    message: "No hay usuarios aún — corre el seed desde Supabase SQL Editor",
  });
}
