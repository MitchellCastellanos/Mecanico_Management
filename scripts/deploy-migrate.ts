/**
 * Ejecuta migraciones SQL idempotentes durante el build de Vercel.
 * Equivalente a Flyway en deploy: alinea Supabase con prisma/schema.prisma.
 *
 * Requiere DATABASE_URL disponible en el entorno de build (Vercel → Settings →
 * Environment Variables → marcar "Build" para Production).
 */
import { runIncrementalMigrate, SCHEMA_VERSION } from "../src/lib/incremental-migrate";
import { db } from "../src/lib/db";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.warn("[deploy-migrate] DATABASE_URL no configurada — omitiendo (build local OK)");
    return;
  }

  if (process.env.VERCEL !== "1") {
    console.warn("[deploy-migrate] Solo corre en build de Vercel — omitiendo en local");
    return;
  }

  if (process.env.SKIP_DB_MIGRATE === "1") {
    console.warn("[deploy-migrate] SKIP_DB_MIGRATE=1 — omitiendo");
    return;
  }

  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
  console.log(`[deploy-migrate] Aplicando schema ${SCHEMA_VERSION} (${env})…`);

  const count = await runIncrementalMigrate();
  console.log(`[deploy-migrate] OK — ${count} sentencias, versión ${SCHEMA_VERSION}`);
}

main()
  .catch((err) => {
    console.error("[deploy-migrate] FALLO — el deploy se detiene para evitar producción rota:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
