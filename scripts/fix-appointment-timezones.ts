/**
 * Corrige citas INTERNAL creadas en el panel cuando el servidor guardaba
 * la hora como UTC (p. ej. Vercel) en lugar de la zona del taller.
 *
 * No toca PUBLIC_WEB (ya usaban parseShopDateTime).
 * No toca citas que ya coinciden con la hora en zona del taller.
 *
 * Uso:
 *   npx tsx scripts/fix-appointment-timezones.ts           # simulación
 *   npx tsx scripts/fix-appointment-timezones.ts --apply   # aplicar cambios
 *
 * Si corrés el script en local y ya había un intento con parseShopDateTime
 * dependiente del TZ de la PC, volvé a ejecutar --apply tras actualizar shop-timezone.ts.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  formatShopDate,
  formatShopTime,
  parseShopDateTime,
} from "../src/lib/shop-timezone";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

const apply = process.argv.includes("--apply");

function utcWallClock(startsAt: Date) {
  const y = startsAt.getUTCFullYear();
  const m = String(startsAt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(startsAt.getUTCDate()).padStart(2, "0");
  const h = String(startsAt.getUTCHours()).padStart(2, "0");
  const min = String(startsAt.getUTCMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${d}`, time: `${h}:${min}` };
}

function asUtcMs(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min);
}

/** ¿Esta cita tiene el bug “hora guardada como UTC en vez de zona del taller”? */
function analyze(startsAt: Date, timeZone: string) {
  const shopDate = formatShopDate(startsAt, timeZone);
  const shopTime = formatShopTime(startsAt, timeZone);
  const fromShop = parseShopDateTime(shopDate, shopTime, timeZone);

  if (Math.abs(fromShop.getTime() - startsAt.getTime()) < 1000) {
    return { needsFix: false, reason: "ya correcta (hora en zona del taller)" };
  }

  const wall = utcWallClock(startsAt);
  if (Math.abs(startsAt.getTime() - asUtcMs(wall.date, wall.time)) >= 1000) {
    return { needsFix: false, reason: "no coincide con patrón UTC-wall" };
  }

  const fixed = parseShopDateTime(wall.date, wall.time, timeZone);
  return {
    needsFix: true,
    reason: "UTC-wall → zona del taller",
    wall,
    shopBefore: { date: shopDate, time: shopTime },
    shopAfter: {
      date: formatShopDate(fixed, timeZone),
      time: formatShopTime(fixed, timeZone),
    },
    fixed,
  };
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    throw new Error("Falta DATABASE_URL o DIRECT_URL en .env");
  }

  const appointments = await prisma.appointment.findMany({
    where: { source: "INTERNAL" },
    include: { shop: { select: { name: true, timezone: true } } },
    orderBy: { startsAt: "asc" },
  });

  const toFix: {
    id: string;
    title: string;
    shopName: string;
    startsAt: Date;
    endsAt: Date;
    durationMinutes: number;
    timeZone: string;
    fixedStartsAt: Date;
    fixedEndsAt: Date;
    shopBefore: { date: string; time: string };
    shopAfter: { date: string; time: string };
  }[] = [];

  for (const apt of appointments) {
    const tz = apt.shop.timezone;
    const result = analyze(apt.startsAt, tz);
    if (!result.needsFix || !result.fixed) continue;

    const durationMs = apt.endsAt.getTime() - apt.startsAt.getTime();
    const fixedStartsAt = result.fixed;
    const fixedEndsAt = new Date(fixedStartsAt.getTime() + durationMs);

    toFix.push({
      id: apt.id,
      title: apt.title,
      shopName: apt.shop.name,
      startsAt: apt.startsAt,
      endsAt: apt.endsAt,
      durationMinutes: apt.durationMinutes,
      timeZone: tz,
      fixedStartsAt,
      fixedEndsAt,
      shopBefore: result.shopBefore!,
      shopAfter: result.shopAfter!,
    });
  }

  console.log(`\nCitas INTERNAL en DB: ${appointments.length}`);
  console.log(`A corregir: ${toFix.length}`);
  console.log(apply ? "Modo: APLICAR cambios\n" : "Modo: SIMULACIÓN (usa --apply para guardar)\n");

  if (toFix.length === 0) {
    console.log("Nada que actualizar.");
    return;
  }

  for (const row of toFix) {
    console.log(`— ${row.id}`);
    console.log(`  ${row.shopName} · ${row.title}`);
    console.log(
      `  Antes (mostrado en taller): ${row.shopBefore.date} ${row.shopBefore.time}`
    );
    console.log(
      `  Después:                  ${row.shopAfter.date} ${row.shopAfter.time} (${row.timeZone})`
    );
    console.log(`  UTC antes:  ${row.startsAt.toISOString()}`);
    console.log(`  UTC después: ${row.fixedStartsAt.toISOString()}\n`);
  }

  if (!apply) {
    console.log("Ejecuta con --apply para guardar en la base de datos.");
    return;
  }

  let updated = 0;
  for (const row of toFix) {
    await prisma.appointment.update({
      where: { id: row.id },
      data: {
        startsAt: row.fixedStartsAt,
        endsAt: row.fixedEndsAt,
      },
    });
    updated++;
  }

  console.log(`\nListo: ${updated} cita(s) actualizada(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
