-- RevenueType on Invoice + CashDrawerEntry for internal cash tracking
CREATE TYPE "mecanico"."RevenueType" AS ENUM ('OFFICIAL', 'INTERNAL_ONLY');

ALTER TABLE "mecanico"."Invoice"
  ADD COLUMN "revenueType" "mecanico"."RevenueType" NOT NULL DEFAULT 'OFFICIAL';

UPDATE "mecanico"."Invoice" SET "revenueType" = 'OFFICIAL' WHERE "revenueType" IS NULL;

CREATE TYPE "mecanico"."CashDrawerEntryType" AS ENUM (
  'OPENING_BALANCE',
  'CASH_IN',
  'CASH_OUT',
  'ADJUSTMENT',
  'CLOSING_BALANCE'
);

CREATE TABLE "mecanico"."CashDrawerEntry" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "type" "mecanico"."CashDrawerEntryType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "linkedInvoiceId" TEXT,
  "paymentMethod" "mecanico"."InvoicePaymentEntryMethod",
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashDrawerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CashDrawerEntry_shopId_occurredAt_idx" ON "mecanico"."CashDrawerEntry"("shopId", "occurredAt");
CREATE INDEX "CashDrawerEntry_linkedInvoiceId_idx" ON "mecanico"."CashDrawerEntry"("linkedInvoiceId");

ALTER TABLE "mecanico"."CashDrawerEntry"
  ADD CONSTRAINT "CashDrawerEntry_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "mecanico"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mecanico"."CashDrawerEntry"
  ADD CONSTRAINT "CashDrawerEntry_linkedInvoiceId_fkey"
  FOREIGN KEY ("linkedInvoiceId") REFERENCES "mecanico"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
