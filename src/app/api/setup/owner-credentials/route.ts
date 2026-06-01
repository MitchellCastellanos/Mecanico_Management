import { NextRequest, NextResponse } from "next/server";
import { updateOwnerCredentials } from "@/lib/update-owner-credentials";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let password = "Canada2026";
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.password === "string" && body.password.length >= 8) {
      password = body.password;
    }
  } catch {
    // default password
  }

  try {
    const result = await updateOwnerCredentials(password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
