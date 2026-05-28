/**
 * Aplica migración incremental en Supabase (usa DIRECT_URL).
 * Uso: npx tsx scripts/apply-incremental-migrate.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { INCREMENTAL_MIGRATE_STATEMENTS } from "../src/lib/incremental-migrate";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DIRECT_URL o DATABASE_URL en .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Script usa su propia conexión; reimplementamos con prisma local
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TYPE mecanico."InvoiceLanguage" AS ENUM ('ES', 'EN', 'FR')`
    );
    console.log("✓ Enum InvoiceLanguage creado");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      console.log("✓ Enum InvoiceLanguage ya existe");
    } else {
      throw e;
    }
  }

  for (const statement of INCREMENTAL_MIGRATE_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
    console.log("✓", statement.slice(0, 70));
  }
  console.log("Migración incremental completada.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
