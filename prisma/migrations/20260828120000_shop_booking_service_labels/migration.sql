-- ShopBookingService pasa de "override por clave fija (key)" a filas con
-- nombre propio en francés/inglés/español, para que el taller pueda agregar
-- y editar servicios libremente (no solo los 13 de fábrica).
ALTER TABLE "mecanico"."ShopBookingService" ADD COLUMN "labelFr" TEXT;
ALTER TABLE "mecanico"."ShopBookingService" ADD COLUMN "labelEn" TEXT;
ALTER TABLE "mecanico"."ShopBookingService" ADD COLUMN "labelEs" TEXT;

UPDATE "mecanico"."ShopBookingService"
SET "labelFr" = COALESCE("labelFr", "key"),
    "labelEn" = COALESCE("labelEn", "key"),
    "labelEs" = COALESCE("labelEs", "key")
WHERE "labelFr" IS NULL OR "labelEn" IS NULL OR "labelEs" IS NULL;

ALTER TABLE "mecanico"."ShopBookingService" ALTER COLUMN "labelFr" SET NOT NULL;
ALTER TABLE "mecanico"."ShopBookingService" ALTER COLUMN "labelEn" SET NOT NULL;
ALTER TABLE "mecanico"."ShopBookingService" ALTER COLUMN "labelEs" SET NOT NULL;

DROP INDEX IF EXISTS "mecanico"."ShopBookingService_shopId_key_key";
ALTER TABLE "mecanico"."ShopBookingService" DROP COLUMN "key";
