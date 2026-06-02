"use server";

import { ADMIN } from "@/lib/routes";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getShopId } from "@/lib/shop-context";
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations";
import { formatClientName } from "@/lib/client-name";
import { sendAppointmentEmail } from "@/lib/email";
import { shopToEmailConfig } from "@/lib/email-config";
import { BRAND } from "@/config/brand";
import {
  type AppointmentView,
  addShopDays,
  currentShopDate,
  formatShopDate,
  formatShopDateTime,
  formatShopTime,
  getDayRangeShop,
  getMonthRange,
  getWeekRangeShop,
  monthFromDate,
  parseShopDateTime,
  shiftMonth,
} from "@/lib/shop-timezone";

async function getShopTimezone(shopId: string): Promise<string> {
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { timezone: true },
  });
  return shop?.timezone ?? BRAND.timezone;
}

function parseStartsAt(date: string, time: string, timeZone: string): Date {
  return parseShopDateTime(date, time, timeZone);
}

function resolveRange(
  view: AppointmentView,
  date: string | undefined,
  timeZone: string
) {
  const today = currentShopDate(timeZone);

  if (view === "day") {
    const day = date ?? today;
    return { ...getDayRangeShop(day, timeZone), anchor: day, view };
  }

  if (view === "week") {
    const anchor = date ?? today;
    const range = getWeekRangeShop(anchor, timeZone);
    return { ...range, anchor: range.weekStart, view };
  }

  const month = date ? monthFromDate(date.length === 7 ? `${date}-01` : date) : monthFromDate(today);
  const range = getMonthRange(month, timeZone);
  return { ...range, anchor: range.month, view };
}

// ── READ ────────────────────────────────────────────────────

export async function getMechanics() {
  const shopId = await getShopId();

  return db.user.findMany({
    where: {
      shopId,
      role: { in: ["MECHANIC", "OWNER"] },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function getAppointments(options?: {
  view?: AppointmentView;
  date?: string;
  /** @deprecated use date + view=week */
  week?: string;
}) {
  const shopId = await getShopId();
  const timeZone = await getShopTimezone(shopId);

  const view: AppointmentView = options?.view ?? "month";
  const dateParam = options?.date ?? options?.week;
  const { start, end, anchor, view: resolvedView } = resolveRange(view, dateParam, timeZone);

  const appointments = await db.appointment.findMany({
    where: {
      shopId,
      startsAt: { gte: start, lt: end },
    },
    include: {
      client: true,
      vehicle: true,
      mechanic: { select: { id: true, name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  return {
    appointments,
    view: resolvedView,
    anchor,
    timeZone,
    weekStart: resolvedView === "week" ? anchor : getWeekRangeShop(anchor, timeZone).weekStart,
  };
}

export async function getAppointmentById(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: {
      client: true,
      vehicle: true,
      mechanic: { select: { id: true, name: true } },
      shop: true,
    },
  });

  if (!appointment) redirect(ADMIN.appointments);
  return appointment;
}

export async function getAppointmentFormData() {
  const shopId = await getShopId();

  const [clients, mechanics] = await Promise.all([
    db.client.findMany({
      where: { shopId },
      include: { vehicles: true },
      orderBy: { lastName: "asc" },
    }),
    getMechanics(),
  ]);

  return { clients, mechanics };
}

// ── Conflict check ──────────────────────────────────────────

export async function checkMechanicConflict(
  mechanicId: string,
  startsAt: Date,
  endsAt: Date,
  excludeId?: string
): Promise<boolean> {
  const shopId = await getShopId();

  const conflict = await db.appointment.findFirst({
    where: {
      shopId,
      mechanicId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  return Boolean(conflict);
}

// ── CREATE / UPDATE ─────────────────────────────────────────

export async function createAppointment(formData: AppointmentFormData) {
  const shopId = await getShopId();
  const timeZone = await getShopTimezone(shopId);

  const parsed = appointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, mechanicId, title, date, time, durationMinutes, notes } =
    parsed.data;

  const startsAt = parseStartsAt(date, time, timeZone);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (mechanicId) {
    const hasConflict = await checkMechanicConflict(mechanicId, startsAt, endsAt);
    if (hasConflict) {
      return { error: { mechanicId: ["El mecánico ya tiene otra cita en ese horario"] } };
    }
  }

  await db.appointment.create({
    data: {
      shopId,
      clientId,
      vehicleId: vehicleId || null,
      mechanicId: mechanicId || null,
      title,
      startsAt,
      endsAt,
      durationMinutes,
      notes: notes || null,
      status: "SCHEDULED",
    },
  });

  revalidatePath(ADMIN.appointments);
  redirect(`${ADMIN.appointments}?view=day&date=${date}`);
}

export async function updateAppointment(id: string, formData: AppointmentFormData) {
  const shopId = await getShopId();
  const timeZone = await getShopTimezone(shopId);

  const existing = await db.appointment.findFirst({
    where: { id, shopId, status: { notIn: ["CANCELLED", "COMPLETED"] } },
  });

  if (!existing) {
    return { error: { _form: ["Cita no encontrada o no editable"] } };
  }

  const parsed = appointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, mechanicId, title, date, time, durationMinutes, notes } =
    parsed.data;

  const startsAt = parseStartsAt(date, time, timeZone);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (mechanicId) {
    const hasConflict = await checkMechanicConflict(mechanicId, startsAt, endsAt, id);
    if (hasConflict) {
      return { error: { mechanicId: ["El mecánico ya tiene otra cita en ese horario"] } };
    }
  }

  await db.appointment.update({
    where: { id },
    data: {
      clientId,
      vehicleId: vehicleId || null,
      mechanicId: mechanicId || null,
      title,
      startsAt,
      endsAt,
      durationMinutes,
      notes: notes || null,
    },
  });

  revalidatePath(ADMIN.appointments);
  redirect(`${ADMIN.appointments}?view=day&date=${date}`);
}

export async function cancelAppointment(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { client: true, shop: true },
  });

  if (!appointment) {
    return { error: "Cita no encontrada" };
  }

  if (appointment.status === "CANCELLED") {
    return { error: "La cita ya está cancelada" };
  }

  await db.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  if (appointment.client.email) {
    try {
      await sendAppointmentCancellation(id);
    } catch (err) {
      console.error(`Error enviando cancelación de cita ${id}:`, err);
    }
  }

  revalidatePath(ADMIN.appointments);
  return { success: true };
}

// ── Email ───────────────────────────────────────────────────

export async function sendAppointmentConfirmation(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { client: true, shop: true },
  });

  if (!appointment) {
    return { error: "Cita no encontrada" };
  }

  const clientEmail = appointment.client.email?.trim();
  if (!clientEmail) {
    return { error: "El cliente no tiene email configurado" };
  }

  try {
    await sendAppointmentEmail({
      shop: shopToEmailConfig(appointment.shop),
      to: clientEmail,
      type: "confirmation",
      clientName: formatClientName(appointment.client),
      title: appointment.title,
      startsAtFormatted: formatShopDateTime(appointment.startsAt, appointment.shop.timezone),
      shopPhone: appointment.shop.phone,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { error: message };
  }

  await db.appointment.update({
    where: { id },
    data: {
      confirmationSentAt: new Date(),
      status: appointment.status === "SCHEDULED" ? "CONFIRMED" : appointment.status,
    },
  });

  revalidatePath(ADMIN.appointments);
  return { success: true, sentTo: clientEmail };
}

export async function sendAppointmentCancellation(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { client: true, shop: true },
  });

  if (!appointment) {
    return { error: "Cita no encontrada" };
  }

  const clientEmail = appointment.client.email?.trim();
  if (!clientEmail) {
    return { error: "El cliente no tiene email configurado" };
  }

  await sendAppointmentEmail({
    shop: shopToEmailConfig(appointment.shop),
    to: clientEmail,
    type: "cancellation",
    clientName: formatClientName(appointment.client),
    title: appointment.title,
    startsAtFormatted: formatShopDateTime(appointment.startsAt, appointment.shop.timezone),
    shopPhone: appointment.shop.phone,
  });

  await db.appointment.update({
    where: { id },
    data: { cancellationSentAt: new Date() },
  });

  revalidatePath(ADMIN.appointments);
  return { success: true, sentTo: clientEmail };
}

export async function sendAppointmentReminder(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { client: true, shop: true },
  });

  if (!appointment) {
    return { error: "Cita no encontrada" };
  }

  const clientEmail = appointment.client.email?.trim();
  if (!clientEmail) {
    return { error: "El cliente no tiene email configurado" };
  }

  await sendAppointmentEmail({
    shop: shopToEmailConfig(appointment.shop),
    to: clientEmail,
    type: "reminder",
    clientName: formatClientName(appointment.client),
    title: appointment.title,
    startsAtFormatted: formatShopDateTime(appointment.startsAt, appointment.shop.timezone),
    shopPhone: appointment.shop.phone,
  });

  await db.appointment.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

  return { success: true, sentTo: clientEmail };
}

/** Para formulario de edición: fecha y hora en zona del taller */
export async function appointmentToFormValues(startsAt: Date, shopTimezone: string) {
  return {
    date: formatShopDate(startsAt, shopTimezone),
    time: formatShopTime(startsAt, shopTimezone),
  };
}

export { shiftMonth, addShopDays };
