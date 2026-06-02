/** Convierte fecha/hora local del taller a Date UTC para guardar en DB. */
export function parseShopDateTime(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  const naive = new Date(`${dateStr}T${timeStr}:00`);
  const inUtc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const inShop = new Date(naive.toLocaleString("en-US", { timeZone }));
  const offsetMs = inUtc.getTime() - inShop.getTime();
  return new Date(naive.getTime() + offsetMs);
}

/** YYYY-MM-DD en la zona horaria del taller. */
export function formatShopDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** HH:mm en la zona horaria del taller. */
export function formatShopTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function getShopDayOfWeek(dateStr: string, timeZone: string): number {
  const noon = parseShopDateTime(dateStr, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(noon);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export type AppointmentView = "month" | "week" | "day";

export function addShopDays(dateStr: string, days: number, timeZone: string): string {
  const at = parseShopDateTime(dateStr, "12:00", timeZone);
  at.setTime(at.getTime() + days * 86_400_000);
  return formatShopDate(at, timeZone);
}

export function formatShopDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShopDayHeader(date: Date | string, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

export function formatShopTimeLabel(date: Date | string, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function currentShopDate(timeZone: string): string {
  return formatShopDate(new Date(), timeZone);
}

export function getMonthRange(month: string, timeZone: string) {
  const [y, m] = month.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const daysInMonth = new Date(y, m, 0).getDate();
  const last = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const start = parseShopDateTime(first, "00:00", timeZone);
  const end = parseShopDateTime(last, "23:59", timeZone);
  end.setMinutes(end.getMinutes() + 1);
  return { start, end, month: `${y}-${String(m).padStart(2, "0")}` };
}

export function getWeekRangeShop(anchorDate: string, timeZone: string) {
  const dayOfWeek = getShopDayOfWeek(anchorDate, timeZone);
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = addShopDays(anchorDate, mondayOffset, timeZone);
  const weekEnd = addShopDays(weekStart, 6, timeZone);
  const start = parseShopDateTime(weekStart, "00:00", timeZone);
  const end = parseShopDateTime(weekEnd, "23:59", timeZone);
  end.setMinutes(end.getMinutes() + 1);
  return { start, end, weekStart };
}

export function getDayRangeShop(day: string, timeZone: string) {
  const start = parseShopDateTime(day, "00:00", timeZone);
  const end = parseShopDateTime(day, "23:59", timeZone);
  end.setMinutes(end.getMinutes() + 1);
  return { start, end, day };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}
