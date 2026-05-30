-- Cotizaciones, citas y configuración de recordatorios de citas

-- Enums
DO $$ BEGIN
  CREATE TYPE "mecanico"."QuoteStatus" AS ENUM (
    'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "mecanico"."AppointmentStatus" AS ENUM (
    'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Shop columns
ALTER TABLE "mecanico"."Shop"
  ADD COLUMN IF NOT EXISTS "appointmentReminderHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "appointmentEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Quote
CREATE TABLE IF NOT EXISTS "mecanico"."Quote" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "status" "mecanico"."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
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
  "language" "mecanico"."InvoiceLanguage" NOT NULL DEFAULT 'ES',
  "notes" TEXT,
  "mileageIn" INTEGER,
  "mileageOut" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Quote_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "mecanico"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "mecanico"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Quote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "mecanico"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_shopId_quoteNumber_key"
  ON "mecanico"."Quote"("shopId", "quoteNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_convertedInvoiceId_key"
  ON "mecanico"."Quote"("convertedInvoiceId");

-- QuoteLineItem
CREATE TABLE IF NOT EXISTS "mecanico"."QuoteLineItem" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(8,2) NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "lineTotal" DECIMAL(10,2) NOT NULL,
  "itemType" "mecanico"."LineItemType" NOT NULL DEFAULT 'LABOUR',
  "warrantyTerm" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "mecanico"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Appointment
CREATE TABLE IF NOT EXISTS "mecanico"."Appointment" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "vehicleId" TEXT,
  "mechanicId" TEXT,
  "title" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "status" "mecanico"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "confirmationSentAt" TIMESTAMP(3),
  "reminderSentAt" TIMESTAMP(3),
  "cancellationSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "mecanico"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "mecanico"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "mecanico"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Appointment_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "mecanico"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Appointment_shopId_startsAt_idx"
  ON "mecanico"."Appointment"("shopId", "startsAt");
