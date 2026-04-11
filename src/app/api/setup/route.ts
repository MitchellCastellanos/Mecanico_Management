import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { execSync } from "child_process";

// Extend the serverless function timeout so prisma db push has time to complete
export const maxDuration = 60;

// Endpoint de setup inicial — sincroniza el schema y crea shop/usuario demo.
// Visitar UNA VEZ después del primer deploy: https://tu-app.vercel.app/api/setup
// Después de crear el usuario, este endpoint devuelve "Ya configurado" y no hace nada más.

export async function GET() {
  // Sync DB schema at runtime (Vercel build servers can't reach Supabase port 5432)
  let pushOutput = "";
  let pushError = "";
  try {
    pushOutput = execSync("node_modules/.bin/prisma db push --accept-data-loss", {
      env: { ...process.env },
      encoding: "utf-8",
      timeout: 55000,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; stderr?: string; stdout?: string };
    pushError = e.stderr ?? e.stdout ?? e.message ?? String(err);
    console.error("prisma db push failed:", pushError);
    // Tables may already exist — attempt the seed queries anyway
  }

  let userCount: number;
  try {
    userCount = await db.user.count();
  } catch (err) {
    // Tables still don't exist — return diagnostic info
    return NextResponse.json(
      {
        error: "DB tables missing. prisma db push may have failed.",
        pushOutput: pushOutput.slice(0, 2000),
        pushError: pushError.slice(0, 2000),
        dbError: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  if (userCount > 0) {
    return NextResponse.json({
      message: "Ya configurado — la base de datos ya tiene usuarios.",
      login: { email: "demo@mecanico.com", password: "demo123" },
    });
  }

  // Crear shop
  const shop = await db.shop.upsert({
    where: { id: "shop-carlos-mtl" },
    update: {},
    create: {
      id: "shop-carlos-mtl",
      name: "Garage Carlos MTL",
      address: "1234 Rue Saint-Denis, Montréal, QC H2X 3K1",
      phone: "514-555-0198",
      email: "carlos@garagecarlosmtl.com",
      taxId: "TPS: 123456789 RT0001 | TVQ: 123456789 TQ0001",
      currency: "CAD",
    },
  });

  // Crear usuario demo
  const passwordHash = await bcrypt.hash("demo123", 12);

  await db.user.upsert({
    where: { email: "demo@mecanico.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Carlos Rodríguez",
      email: "demo@mecanico.com",
      passwordHash,
      role: "OWNER",
    },
  });

  // Crear algunos clientes de demo para que no quede vacío
  const clients = await Promise.all([
    db.client.create({
      data: {
        shopId: shop.id,
        firstName: "Jean",
        lastName: "Tremblay",
        email: "jean.tremblay@email.com",
        phone: "514-555-0101",
        address: "456 Rue Sainte-Catherine, Montréal, QC",
      },
    }),
    db.client.create({
      data: {
        shopId: shop.id,
        firstName: "Marie",
        lastName: "Gagnon",
        email: "marie.gagnon@email.com",
        phone: "514-555-0102",
      },
    }),
    db.client.create({
      data: {
        shopId: shop.id,
        firstName: "Luis",
        lastName: "García",
        email: "luis.garcia@email.com",
        phone: "514-555-0103",
      },
    }),
  ]);

  // Crear vehículos para cada cliente
  await db.vehicle.createMany({
    data: [
      { clientId: clients[0].id, make: "Toyota", model: "Camry", year: 2019, licensePlate: "ABC-1234", mileageUnit: "KM" },
      { clientId: clients[0].id, make: "Honda", model: "CRV", year: 2021, licensePlate: "XYZ-5678", mileageUnit: "KM" },
      { clientId: clients[1].id, make: "Hyundai", model: "Elantra", year: 2018, licensePlate: "DEF-9012", mileageUnit: "KM" },
      { clientId: clients[2].id, make: "Ford", model: "F-150", year: 2020, licensePlate: "GHI-3456", mileageUnit: "KM" },
    ],
  });

  return NextResponse.json({
    message: "✅ Setup completado exitosamente",
    login: {
      email: "demo@mecanico.com",
      password: "demo123",
    },
    creado: {
      shop: shop.name,
      clientes: clients.length,
      vehiculos: 4,
    },
  });
}
