-- Garantía por línea + catálogo de conceptos frecuentes
ALTER TABLE "mecanico"."InvoiceLineItem"
  ADD COLUMN IF NOT EXISTS "warrantyTerm" TEXT;

CREATE TABLE IF NOT EXISTS "mecanico"."SavedLineItem" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "itemType" "mecanico"."LineItemType" NOT NULL DEFAULT 'LABOUR',
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "useCount" INTEGER NOT NULL DEFAULT 1,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedLineItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedLineItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "mecanico"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedLineItem_shopId_description_key"
  ON "mecanico"."SavedLineItem"("shopId", "description");
