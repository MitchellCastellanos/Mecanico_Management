-- Servicios del calendario público (/book/[slug]) configurables por taller:
-- duración y visibilidad. Sin fila para una clave = usa el default de
-- src/lib/service-catalog.ts (activo, duración por defecto).
CREATE TABLE "mecanico"."ShopBookingService" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopBookingService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopBookingService_shopId_key_key" ON "mecanico"."ShopBookingService"("shopId", "key");

ALTER TABLE "mecanico"."ShopBookingService" ADD CONSTRAINT "ShopBookingService_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "mecanico"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
