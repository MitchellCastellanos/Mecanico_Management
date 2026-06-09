import { db } from "@/lib/db";

/** Incrementa al añadir bloques nuevos en INCREMENTAL_MIGRATE_STATEMENTS. */
export const SCHEMA_VERSION = "20260609-revenue-type-cash-drawer-v1";

/** Sentencias idempotentes para alinear producción con el schema Prisma actual. */
export const INCREMENTAL_MIGRATE_STATEMENTS = [
  `CREATE SCHEMA IF NOT EXISTS mecanico`,
  `CREATE TABLE IF NOT EXISTS mecanico."SchemaMigration" (
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchemaMigration_pkey" PRIMARY KEY ("version")
  )`,
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
  `ALTER TABLE mecanico."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "warrantyTerm" TEXT`,
  `CREATE TABLE IF NOT EXISTS mecanico."SavedLineItem" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" mecanico."LineItemType" NOT NULL DEFAULT 'LABOUR',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedLineItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SavedLineItem_shopId_description_key" ON mecanico."SavedLineItem"("shopId", "description")`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "appointmentReminderHours" INTEGER NOT NULL DEFAULT 24`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "appointmentEmailsEnabled" BOOLEAN NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS mecanico."Quote" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" mecanico."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailSendCount" INTEGER NOT NULL DEFAULT 0,
    "convertedInvoiceId" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(6,5) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "language" mecanico."InvoiceLanguage" NOT NULL DEFAULT 'ES',
    "notes" TEXT,
    "mileageIn" INTEGER,
    "mileageOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Quote_shopId_quoteNumber_key" ON mecanico."Quote"("shopId", "quoteNumber")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Quote_convertedInvoiceId_key" ON mecanico."Quote"("convertedInvoiceId")`,
  `CREATE TABLE IF NOT EXISTS mecanico."QuoteLineItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "itemType" mecanico."LineItemType" NOT NULL DEFAULT 'LABOUR',
    "warrantyTerm" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS mecanico."Appointment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "mechanicId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" mecanico."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "confirmationSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "cancellationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Appointment_shopId_startsAt_idx" ON mecanico."Appointment"("shopId", "startsAt")`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Shop_slug_key" ON mecanico."Shop"("slug")`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "bookingEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Montreal'`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "bookingSlotMinutes" INTEGER NOT NULL DEFAULT 60`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "bookingLeadTimeHours" INTEGER NOT NULL DEFAULT 24`,
  `ALTER TABLE mecanico."Shop" ADD COLUMN IF NOT EXISTS "bookingAdvanceDays" INTEGER NOT NULL DEFAULT 30`,
  `ALTER TABLE mecanico."User" ADD COLUMN IF NOT EXISTS "bookable" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE mecanico."Appointment" ADD COLUMN IF NOT EXISTS "source" mecanico."AppointmentSource" NOT NULL DEFAULT 'INTERNAL'`,
  `CREATE TABLE IF NOT EXISTS mecanico."ShopWorkingHours" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ShopWorkingHours_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ShopWorkingHours_shopId_dayOfWeek_key" ON mecanico."ShopWorkingHours"("shopId", "dayOfWeek")`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "paymentMode" mecanico."InvoicePaymentMode"`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "recordedRevenue" DECIMAL(10,2)`,
  `CREATE TABLE IF NOT EXISTS mecanico."InvoicePaymentEntry" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" mecanico."InvoicePaymentEntryMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receiptPath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoicePaymentEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InvoicePaymentEntry_invoiceId_idx" ON mecanico."InvoicePaymentEntry"("invoiceId")`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."InvoicePaymentEntry"
      ADD CONSTRAINT "InvoicePaymentEntry_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES mecanico."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "paymentExtraPaths" JSONB NOT NULL DEFAULT '[]'`,
  // ── Multi-vehículo: InvoiceVehicle / QuoteVehicle ─────────────
  `CREATE TABLE IF NOT EXISTS mecanico."InvoiceVehicle" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "mileageIn" INTEGER,
    "mileageOut" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceVehicle_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InvoiceVehicle_invoiceId_idx" ON mecanico."InvoiceVehicle"("invoiceId")`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."InvoiceVehicle"
      ADD CONSTRAINT "InvoiceVehicle_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES mecanico."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."InvoiceVehicle"
      ADD CONSTRAINT "InvoiceVehicle_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES mecanico."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'Invoice' AND column_name = 'vehicleId'
    ) THEN
      INSERT INTO mecanico."InvoiceVehicle" ("id", "invoiceId", "vehicleId", "mileageIn", "mileageOut", "sortOrder")
      SELECT "id" || '_veh', "id", "vehicleId", "mileageIn", "mileageOut", 0
      FROM mecanico."Invoice"
      ON CONFLICT ("id") DO NOTHING;
    END IF;
  END $$`,
  `ALTER TABLE mecanico."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "invoiceVehicleId" TEXT`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'InvoiceLineItem' AND column_name = 'invoiceId'
    ) THEN
      UPDATE mecanico."InvoiceLineItem"
      SET "invoiceVehicleId" = "invoiceId" || '_veh'
      WHERE "invoiceVehicleId" IS NULL;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'InvoiceLineItem'
        AND column_name = 'invoiceVehicleId' AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE mecanico."InvoiceLineItem" ALTER COLUMN "invoiceVehicleId" SET NOT NULL;
    END IF;
  END $$`,
  `ALTER TABLE mecanico."InvoiceLineItem" DROP COLUMN IF EXISTS "invoiceId"`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."InvoiceLineItem"
      ADD CONSTRAINT "InvoiceLineItem_invoiceVehicleId_fkey"
      FOREIGN KEY ("invoiceVehicleId") REFERENCES mecanico."InvoiceVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `ALTER TABLE mecanico."Invoice" DROP COLUMN IF EXISTS "vehicleId"`,
  `ALTER TABLE mecanico."Invoice" DROP COLUMN IF EXISTS "mileageIn"`,
  `ALTER TABLE mecanico."Invoice" DROP COLUMN IF EXISTS "mileageOut"`,
  `CREATE TABLE IF NOT EXISTS mecanico."QuoteVehicle" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "mileageIn" INTEGER,
    "mileageOut" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteVehicle_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "QuoteVehicle_quoteId_idx" ON mecanico."QuoteVehicle"("quoteId")`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."QuoteVehicle"
      ADD CONSTRAINT "QuoteVehicle_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES mecanico."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."QuoteVehicle"
      ADD CONSTRAINT "QuoteVehicle_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES mecanico."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'Quote' AND column_name = 'vehicleId'
    ) THEN
      INSERT INTO mecanico."QuoteVehicle" ("id", "quoteId", "vehicleId", "mileageIn", "mileageOut", "sortOrder")
      SELECT "id" || '_veh', "id", "vehicleId", "mileageIn", "mileageOut", 0
      FROM mecanico."Quote"
      ON CONFLICT ("id") DO NOTHING;
    END IF;
  END $$`,
  `ALTER TABLE mecanico."QuoteLineItem" ADD COLUMN IF NOT EXISTS "quoteVehicleId" TEXT`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'QuoteLineItem' AND column_name = 'quoteId'
    ) THEN
      UPDATE mecanico."QuoteLineItem"
      SET "quoteVehicleId" = "quoteId" || '_veh'
      WHERE "quoteVehicleId" IS NULL;
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'mecanico' AND table_name = 'QuoteLineItem'
        AND column_name = 'quoteVehicleId' AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE mecanico."QuoteLineItem" ALTER COLUMN "quoteVehicleId" SET NOT NULL;
    END IF;
  END $$`,
  `ALTER TABLE mecanico."QuoteLineItem" DROP COLUMN IF EXISTS "quoteId"`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."QuoteLineItem"
      ADD CONSTRAINT "QuoteLineItem_quoteVehicleId_fkey"
      FOREIGN KEY ("quoteVehicleId") REFERENCES mecanico."QuoteVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `ALTER TABLE mecanico."Quote" DROP COLUMN IF EXISTS "vehicleId"`,
  `ALTER TABLE mecanico."Quote" DROP COLUMN IF EXISTS "mileageIn"`,
  `ALTER TABLE mecanico."Quote" DROP COLUMN IF EXISTS "mileageOut"`,
  // ── RevenueType + Caja ────────────────────────────────────────
  `ALTER TABLE mecanico."Invoice" ADD COLUMN IF NOT EXISTS "revenueType" mecanico."RevenueType" NOT NULL DEFAULT 'OFFICIAL'`,
  `UPDATE mecanico."Invoice" SET "revenueType" = 'OFFICIAL' WHERE "revenueType" IS NULL`,
  `CREATE TABLE IF NOT EXISTS mecanico."CashDrawerEntry" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" mecanico."CashDrawerEntryType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedInvoiceId" TEXT,
    "paymentMethod" mecanico."InvoicePaymentEntryMethod",
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashDrawerEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CashDrawerEntry_shopId_occurredAt_idx" ON mecanico."CashDrawerEntry"("shopId", "occurredAt")`,
  `CREATE INDEX IF NOT EXISTS "CashDrawerEntry_linkedInvoiceId_idx" ON mecanico."CashDrawerEntry"("linkedInvoiceId")`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."CashDrawerEntry"
      ADD CONSTRAINT "CashDrawerEntry_shopId_fkey"
      FOREIGN KEY ("shopId") REFERENCES mecanico."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE mecanico."CashDrawerEntry"
      ADD CONSTRAINT "CashDrawerEntry_linkedInvoiceId_fkey"
      FOREIGN KEY ("linkedInvoiceId") REFERENCES mecanico."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
] as const;

export async function ensureQuoteStatusEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

export async function ensureAppointmentStatusEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

export async function ensureAppointmentSourceEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."AppointmentSource" AS ENUM ('INTERNAL', 'PUBLIC_WEB')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

export async function ensureInvoicePaymentEnums() {
  for (const sql of [
    `CREATE TYPE mecanico."InvoicePaymentMode" AS ENUM ('CARD', 'CASH', 'MIXED')`,
    `CREATE TYPE mecanico."InvoicePaymentEntryMethod" AS ENUM ('CARD', 'CASH')`,
  ]) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("already exists") && !msg.includes("duplicate")) {
        throw err;
      }
    }
  }
}

export async function ensureRevenueTypeEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."RevenueType" AS ENUM ('OFFICIAL', 'INTERNAL_ONLY')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

export async function ensureCashDrawerEntryTypeEnum() {
  try {
    await db.$executeRawUnsafe(
      `CREATE TYPE mecanico."CashDrawerEntryType" AS ENUM ('OPENING_BALANCE', 'CASH_IN', 'CASH_OUT', 'ADJUSTMENT', 'CLOSING_BALANCE')`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("already exists") && !msg.includes("duplicate")) {
      throw err;
    }
  }
}

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
  await ensureInvoicePaymentEnums();
  await ensureRevenueTypeEnum();
  await ensureCashDrawerEntryTypeEnum();
  await ensureQuoteStatusEnum();
  await ensureAppointmentStatusEnum();
  await ensureAppointmentSourceEnum();
  for (const statement of INCREMENTAL_MIGRATE_STATEMENTS) {
    await db.$executeRawUnsafe(statement);
  }
  await db.$executeRawUnsafe(
    `INSERT INTO mecanico."SchemaMigration" ("version") VALUES ('${SCHEMA_VERSION.replace(/'/g, "''")}') ON CONFLICT ("version") DO NOTHING`
  );
  return INCREMENTAL_MIGRATE_STATEMENTS.length;
}

/** Última versión registrada en producción (null si la tabla no existe aún). */
export async function getLatestSchemaVersion(): Promise<string | null> {
  try {
    const rows = await db.$queryRawUnsafe<{ version: string }[]>(
      `SELECT "version" FROM mecanico."SchemaMigration" ORDER BY "appliedAt" DESC LIMIT 1`
    );
    return rows[0]?.version ?? null;
  } catch {
    return null;
  }
}
