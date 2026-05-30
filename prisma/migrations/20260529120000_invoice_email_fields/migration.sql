-- Buzones por canal en Shop + campos de tracking en Invoice
ALTER TABLE "mecanico"."Shop"
  ADD COLUMN IF NOT EXISTS "billingEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "infoEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "providersEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "newsletterEmail" TEXT;

ALTER TABLE "mecanico"."Invoice"
  ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailSendCount" INTEGER NOT NULL DEFAULT 0;
