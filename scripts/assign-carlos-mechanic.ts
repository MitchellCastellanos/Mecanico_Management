/**
 * Deja disponibilidad real de citas en línea para Garage Carlos A Inc.:
 *  1. Sube bookingAdvanceDays a 90 (3 meses) — antes tope de 14/60 días.
 *  2. Marca al dueño (Carlos) como mecánico reservable (bookable = true).
 *  3. Asigna a Carlos todas las citas del taller que no tienen mecánico
 *     asignado — sin esto, esas citas no bloquean horarios en el sitio
 *     público y se podría doble-reservar encima de ellas.
 *
 * No toca horarios del taller (ShopWorkingHours) — un mecánico reservable
 * usa automáticamente el horario de apertura del taller, no tiene horario
 * propio en este esquema.
 *
 * Uso:
 *   npx tsx scripts/assign-carlos-mechanic.ts           # simulación
 *   npx tsx scripts/assign-carlos-mechanic.ts --apply   # aplicar cambios
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BRAND } from "../src/config/brand";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const apply = process.argv.includes("--apply");
const TARGET_ADVANCE_DAYS = 90;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Falta DATABASE_URL en .env");
    process.exit(1);
  }

  const shop = await prisma.shop.findUnique({ where: { id: BRAND.shopId } });
  if (!shop) {
    console.error(`❌ No se encontró el taller ${BRAND.shopId}`);
    process.exit(1);
  }

  console.log(`🏪 ${shop.name} — bookingAdvanceDays actual: ${shop.bookingAdvanceDays}`);

  const owner = await prisma.user.findFirst({
    where: { shopId: shop.id, role: "OWNER" },
  });

  if (!owner) {
    console.error(`❌ No se encontró un usuario OWNER para el taller ${shop.id}`);
    process.exit(1);
  }

  console.log(`👤 Dueño/mecánico: ${owner.name} (${owner.id}) — bookable actual: ${owner.bookable}`);

  const unassigned = await prisma.appointment.findMany({
    where: { shopId: shop.id, mechanicId: null },
    select: { id: true, title: true, startsAt: true, status: true },
    orderBy: { startsAt: "asc" },
  });

  console.log(`📅 Citas sin mecánico asignado: ${unassigned.length}`);
  for (const apt of unassigned) {
    console.log(`   - ${apt.startsAt.toISOString()} · ${apt.title} (${apt.status})`);
  }

  if (!apply) {
    console.log("\n🧪 Simulación — no se guardó nada. Corré con --apply para aplicar los cambios.");
    return;
  }

  if (shop.bookingAdvanceDays !== TARGET_ADVANCE_DAYS) {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { bookingAdvanceDays: TARGET_ADVANCE_DAYS },
    });
    console.log(`✅ bookingAdvanceDays actualizado a ${TARGET_ADVANCE_DAYS} días.`);
  } else {
    console.log("✅ bookingAdvanceDays ya estaba en 90.");
  }

  if (!owner.bookable) {
    await prisma.user.update({ where: { id: owner.id }, data: { bookable: true } });
    console.log("✅ Marcado como reservable (bookable = true).");
  } else {
    console.log("✅ Ya era reservable.");
  }

  if (unassigned.length > 0) {
    const result = await prisma.appointment.updateMany({
      where: { shopId: shop.id, mechanicId: null },
      data: { mechanicId: owner.id },
    });
    console.log(`✅ ${result.count} citas asignadas a ${owner.name}.`);
  } else {
    console.log("✅ No había citas sin mecánico asignado.");
  }

  console.log("\n🎉 Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
