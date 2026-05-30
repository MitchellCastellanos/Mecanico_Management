import { db } from "@/lib/db";
import {
  formatShopDate,
  getShopDayOfWeek,
  parseShopDateTime,
} from "@/lib/shop-timezone";

export interface AvailableSlot {
  date: string;
  time: string;
  startsAt: string;
  mechanicId: string;
  mechanicName: string;
}

const DEFAULT_HOURS = [
  { dayOfWeek: 0, openTime: "09:00", closeTime: "17:00", isClosed: true },
  { dayOfWeek: 1, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "13:00", isClosed: true },
];

export { DEFAULT_HOURS as DEFAULT_WORKING_HOURS };

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getShopBySlug(slug: string) {
  return db.shop.findUnique({
    where: { slug },
    include: { workingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
}

export async function getBookableMechanics(shopId: string) {
  return db.user.findMany({
    where: {
      shopId,
      bookable: true,
      role: { in: ["MECHANIC", "OWNER"] },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getAvailableSlots(
  shop: {
    id: string;
    timezone: string;
    bookingSlotMinutes: number;
    bookingLeadTimeHours: number;
    bookingAdvanceDays: number;
    workingHours: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[];
  },
  dateStr: string,
  mechanicId?: string
): Promise<AvailableSlot[]> {
  const dayOfWeek = getShopDayOfWeek(dateStr, shop.timezone);
  const hours =
    shop.workingHours.find((h) => h.dayOfWeek === dayOfWeek) ??
    DEFAULT_HOURS.find((h) => h.dayOfWeek === dayOfWeek);

  if (!hours || hours.isClosed) return [];

  const now = new Date();
  const minStart = new Date(now.getTime() + shop.bookingLeadTimeHours * 3_600_000);
  const maxDate = new Date(now.getTime() + shop.bookingAdvanceDays * 86_400_000);
  const dayStart = parseShopDateTime(dateStr, "00:00", shop.timezone);
  if (dayStart > maxDate) return [];

  const mechanics = await getBookableMechanics(shop.id);
  const filteredMechanics = mechanicId
    ? mechanics.filter((m) => m.id === mechanicId)
    : mechanics;

  if (filteredMechanics.length === 0) return [];

  const dayEnd = parseShopDateTime(dateStr, "23:59", shop.timezone);
  const existing = await db.appointment.findMany({
    where: {
      shopId: shop.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { mechanicId: true, startsAt: true, endsAt: true },
  });

  const openMin = parseMinutes(hours.openTime);
  const closeMin = parseMinutes(hours.closeTime);
  const slotDuration = shop.bookingSlotMinutes;
  const slots: AvailableSlot[] = [];

  for (let minute = openMin; minute + slotDuration <= closeMin; minute += slotDuration) {
    const time = minutesToTime(minute);
    const startsAt = parseShopDateTime(dateStr, time, shop.timezone);
    const endsAt = new Date(startsAt.getTime() + slotDuration * 60_000);

    if (startsAt < minStart) continue;

    for (const mechanic of filteredMechanics) {
      const busy = existing.some(
        (apt) =>
          apt.mechanicId === mechanic.id &&
          overlaps(startsAt, endsAt, apt.startsAt, apt.endsAt)
      );
      if (!busy) {
        slots.push({
          date: dateStr,
          time,
          startsAt: startsAt.toISOString(),
          mechanicId: mechanic.id,
          mechanicName: mechanic.name,
        });
        break;
      }
    }
  }

  return slots;
}

export async function getBookableDates(
  shop: Parameters<typeof getAvailableSlots>[0],
  days = 14
): Promise<string[]> {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    const dateStr = formatShopDate(d, shop.timezone);
    const slots = await getAvailableSlots(shop, dateStr);
    if (slots.length > 0) dates.push(dateStr);
  }
  return dates;
}

export async function findAvailableMechanic(
  shop: Parameters<typeof getAvailableSlots>[0],
  dateStr: string,
  time: string,
  preferredMechanicId?: string
): Promise<{ id: string; name: string } | null> {
  const slots = await getAvailableSlots(shop, dateStr, preferredMechanicId);
  const match = slots.find((s) => s.time === time);
  if (match) return { id: match.mechanicId, name: match.mechanicName };
  return null;
}
