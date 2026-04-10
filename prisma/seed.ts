import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Crear taller
  const shop = await prisma.shop.upsert({
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

  // Crear usuario administrador
  const passwordHash = await bcrypt.hash("demo123", 12);

  const owner = await prisma.user.upsert({
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

  console.log(`✅ Shop: ${shop.name}`);
  console.log(`✅ Usuario: ${owner.email} / demo123`);
  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
