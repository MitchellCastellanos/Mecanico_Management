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
  await ensureQuoteStatusEnum();
  await ensureAppointmentStatusEnum();
  await ensureAppointmentSourceEnum();
  for (const statement of INCREMENTAL_MIGRATE_STATEMENTS) {
    await db.$executeRawUnsafe(statement);
  }
  return INCREMENTAL_MIGRATE_STATEMENTS.length;
}
