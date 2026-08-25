-- Disponibilidad individual por mecánico para citas.
-- Sin filas para un mecánico = sigue el horario del taller (ShopWorkingHours).
CREATE TABLE "mecanico"."MechanicWorkingHours" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MechanicWorkingHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MechanicWorkingHours_userId_dayOfWeek_key" ON "mecanico"."MechanicWorkingHours"("userId", "dayOfWeek");

ALTER TABLE "mecanico"."MechanicWorkingHours" ADD CONSTRAINT "MechanicWorkingHours_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mecanico"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
