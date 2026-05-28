import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const maxDuration = 60;

/**
 * Inicialización única en producción (Vercel puede alcanzar Supabase).
 * Header: x-setup-secret = CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (process.env.PLATFORM_ADMIN_EMAIL ?? "mitchell.castellanos@hotmail.com").toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  const name = process.env.PLATFORM_ADMIN_NAME ?? "Mitchell Castellanos";

  if (!password) {
    return NextResponse.json(
      { error: "Falta PLATFORM_ADMIN_PASSWORD en variables de entorno" },
      { status: 500 }
    );
  }

  try {
    const hash = await bcrypt.hash(password, 12);

    await db.user.upsert({
      where: { email },
      update: { name, passwordHash: hash, role: "SUPER_ADMIN", shopId: null },
      create: { name, email, passwordHash: hash, role: "SUPER_ADMIN", shopId: null },
    });

    const shop = await db.shop.upsert({
      where: { id: "shop-carlos-mtl" },
      update: {},
      create: {
        id: "shop-carlos-mtl",
        name: "Garage Carlos MTL",
        currency: "CAD",
      },
    });

    const userCount = await db.user.count();

    return NextResponse.json({
      ok: true,
      message: "Bootstrap completado",
      superAdmin: email,
      shop: shop.name,
      users: userCount,
      adminUrl: "/admin",
    });
  } catch (err) {
    console.error("[bootstrap]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
