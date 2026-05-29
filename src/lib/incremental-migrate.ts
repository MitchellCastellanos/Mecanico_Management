import { db } from "@/lib/db";

/** Sentencias idempotentes para alinear producción con el schema Prisma actual. */
export const INCREMENTAL_MIGRATE_STATEMENTS = [
  `CREATE SCHEMA IF NOT EXISTS mecanico`,
  `ALTER TABLE mecanico."Client" ALTER COLUMN "lastName" DROP NOT NULL`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "language" mecanico."InvoiceLanguage" NOT NULL DEFAULT 'ES'`,
  `ALTER TABLE mecanico."Invoice" ALTER COLUMN "taxRate" TYPE DECIMAL(6, 5)`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3)`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3)`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "emailSendCount" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "infoEmail" TEXT`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "providersEmail" TEXT`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "newsletterEmail" TEXT`,
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

export async function runIncrementalMigrate() {
  await ensureInvoiceLanguageEnum();
  for (const statement of INCREMENTAL_MIGRATE_STATEMENTS) {
    await db.$executeRawUnsafe(statement);
  }
  return INCREMENTAL_MIGRATE_STATEMENTS.length;
}
