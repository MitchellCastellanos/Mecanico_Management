import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Endpoint de setup inicial — crea el shop y usuario demo si la BD está vacía.
// Visitar UNA VEZ después del primer deploy: https://tu-app.vercel.app/api/setup
// Después de crear el usuario, este endpoint devuelve "Ya configurado" y no hace nada más.

export async function GET() {
  const userCount = await db.user.count();

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
