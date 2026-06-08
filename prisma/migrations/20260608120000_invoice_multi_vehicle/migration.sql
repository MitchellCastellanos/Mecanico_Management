-- Permite que una factura/cotización cubra varios vehículos del mismo cliente.
-- Se introducen tablas puente InvoiceVehicle / QuoteVehicle (con su propio
-- kilometraje), y las líneas de servicio pasan a agruparse por vehículo.

-- ── InvoiceVehicle ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "mecanico"."InvoiceVehicle" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "mileageIn" INTEGER,
  "mileageOut" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceVehicle_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceVehicle_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "mecanico"."Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InvoiceVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "mecanico"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InvoiceVehicle_invoiceId_idx"
  ON "mecanico"."InvoiceVehicle"("invoiceId");

-- Backfill: cada factura existente tiene exactamente un vehículo hoy,
-- así que creamos una InvoiceVehicle 1:1 con id derivado determinísticamente.
INSERT INTO "mecanico"."InvoiceVehicle" ("id", "invoiceId", "vehicleId", "mileageIn", "mileageOut", "sortOrder")
SELECT "id" || '_veh', "id", "vehicleId", "mileageIn", "mileageOut", 0
FROM "mecanico"."Invoice"
ON CONFLICT ("id") DO NOTHING;

-- InvoiceLineItem ahora cuelga de InvoiceVehicle en lugar de Invoice
ALTER TABLE "mecanico"."InvoiceLineItem" ADD COLUMN IF NOT EXISTS "invoiceVehicleId" TEXT;

UPDATE "mecanico"."InvoiceLineItem"
SET "invoiceVehicleId" = "invoiceId" || '_veh'
WHERE "invoiceVehicleId" IS NULL;

ALTER TABLE "mecanico"."InvoiceLineItem" ALTER COLUMN "invoiceVehicleId" SET NOT NULL;
ALTER TABLE "mecanico"."InvoiceLineItem" DROP COLUMN IF EXISTS "invoiceId";

ALTER TABLE "mecanico"."InvoiceLineItem"
  ADD CONSTRAINT "InvoiceLineItem_invoiceVehicleId_fkey" FOREIGN KEY ("invoiceVehicleId") REFERENCES "mecanico"."InvoiceVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- El vehículo y kilometraje ahora viven en InvoiceVehicle, no en Invoice
ALTER TABLE "mecanico"."Invoice" DROP COLUMN IF EXISTS "vehicleId";
ALTER TABLE "mecanico"."Invoice" DROP COLUMN IF EXISTS "mileageIn";
ALTER TABLE "mecanico"."Invoice" DROP COLUMN IF EXISTS "mileageOut";

-- ── QuoteVehicle ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "mecanico"."QuoteVehicle" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "mileageIn" INTEGER,
  "mileageOut" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuoteVehicle_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuoteVehicle_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "mecanico"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuoteVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "mecanico"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuoteVehicle_quoteId_idx"
  ON "mecanico"."QuoteVehicle"("quoteId");

INSERT INTO "mecanico"."QuoteVehicle" ("id", "quoteId", "vehicleId", "mileageIn", "mileageOut", "sortOrder")
SELECT "id" || '_veh', "id", "vehicleId", "mileageIn", "mileageOut", 0
FROM "mecanico"."Quote"
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "mecanico"."QuoteLineItem" ADD COLUMN IF NOT EXISTS "quoteVehicleId" TEXT;

UPDATE "mecanico"."QuoteLineItem"
SET "quoteVehicleId" = "quoteId" || '_veh'
WHERE "quoteVehicleId" IS NULL;

ALTER TABLE "mecanico"."QuoteLineItem" ALTER COLUMN "quoteVehicleId" SET NOT NULL;
ALTER TABLE "mecanico"."QuoteLineItem" DROP COLUMN IF EXISTS "quoteId";

ALTER TABLE "mecanico"."QuoteLineItem"
  ADD CONSTRAINT "QuoteLineItem_quoteVehicleId_fkey" FOREIGN KEY ("quoteVehicleId") REFERENCES "mecanico"."QuoteVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mecanico"."Quote" DROP COLUMN IF EXISTS "vehicleId";
ALTER TABLE "mecanico"."Quote" DROP COLUMN IF EXISTS "mileageIn";
ALTER TABLE "mecanico"."Quote" DROP COLUMN IF EXISTS "mileageOut";
