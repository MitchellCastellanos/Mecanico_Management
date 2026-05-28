/**
 * Inicializa esquema + super admin + taller demo.
 * Uso (con DATABASE_URL en .env):
 *   npx tsx scripts/bootstrap-platform.ts
 *
 * Variables opcionales:
 *   PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD, PLATFORM_ADMIN_NAME
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { execSync } from "child_process";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = (process.env.PLATFORM_ADMIN_EMAIL ?? "mitchell.castellanos@hotmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD ?? "";
const ADMIN_NAME = process.env.PLATFORM_ADMIN_NAME ?? "Mitchell Castellanos";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Falta DATABASE_URL en .env");
    process.exit(1);
  }
  if (!ADMIN_PASSWORD) {
    console.error("❌ Define PLATFORM_ADMIN_PASSWORD en .env (no se guarda en el repo)");
    process.exit(1);
  }

  if (process.env.SKIP_DB_PUSH !== "1") {
    console.log("📦 Aplicando esquema (prisma db push)...");
    execSync("npx prisma db push", { stdio: "inherit" });
  }

  console.log("👤 Creando super admin de plataforma...");
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      passwordHash: hash,
      role: "SUPER_ADMIN",
      shopId: null,
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: hash,
      role: "SUPER_ADMIN",
      shopId: null,
    },
  });

  const shop = await prisma.shop.upsert({
    where: { id: "shop-carlos-mtl" },
    update: {},
    create: {
      id: "shop-carlos-mtl",
      name: "Garage Carlos MTL",
      phone: "514-555-0198",
      email: "carlos@garagecarlosmtl.com",
      currency: "CAD",
    },
  });

  console.log(`✅ Super admin: ${ADMIN_EMAIL}`);
  console.log(`✅ Taller listo: ${shop.name} (asigna dueño Carlos en /admin/shops/${shop.id})`);
  console.log("\n🎉 Listo. Entra en /login → te manda a /admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
