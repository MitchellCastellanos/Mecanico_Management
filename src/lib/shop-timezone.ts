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
