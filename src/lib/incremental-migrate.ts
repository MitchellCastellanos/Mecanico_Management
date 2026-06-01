import { db } from "@/lib/db";

/** Sentencias idempotentes para alinear producción con el schema Prisma actual. */
export const INCREMENTAL_MIGRATE_STATEMENTS = [
  `CREATE SCHEMA IF NOT EXISTS mecanico`,
  `ALTER TABLE mecanico."Client" ALTER COLUMN "lastName" DROP NOT NULL`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "language" mecanico."InvoiceLanguage" NOT NULL DEFAULT 'ES'`,
  `ALTER TABLE mecanico."Invoice" ALTER COLUMN "taxRate" TYPE DECIMAL(6, 5)`,
  // El estatus inicial pasó de DRAFT a PENDING (los borradores son cotizaciones).
  // El rename del valor del enum se hace en ensureInvoicePendingStatus(); aquí solo
  // realineamos el default de la columna (idempotente).
  `ALTER TABLE mecanico."Invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
] as const;

export async function ensureInvoiceLanguageEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."InvoiceLanguage" AS ENUM ('ES', 'EN', 'FR')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

/**
 * Renombra el valor del enum InvoiceStatus DRAFT → PENDING.
 * Idempotente: si ya fue renombrado (DRAFT no existe o PENDING ya existe), no falla.
 * ALTER TYPE ... RENAME VALUE actualiza automáticamente todas las filas existentes.
 */
export async function ensureInvoicePendingStatus() {
  try {
    await db.$executeRawUnsafe(
      `ALTER TYPE mecanico."InvoiceStatus" RENAME VALUE 'DRAFT' TO 'PENDING'`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 'DRAFT' ya no existe (ya renombrado) o 'PENDING' ya existe → nada que hacer.
    if (!msg.includes("does not exist") && !msg.includes("already exists")) {
      throw err;
    }
  }
}

export async function runIncrementalMigrate() {
  await ensureInvoiceLanguageEnum();
  await ensureInvoicePendingStatus();
  for (const statement of INCREMENTAL_MIGRATE_STATEMENTS) {
    await db.$executeRawUnsafe(statement);
  }
  return INCREMENTAL_MIGRATE_STATEMENTS.length;
}
