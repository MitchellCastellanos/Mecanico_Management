"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getShopId } from "@/lib/shop-context";
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations";
import { formatClientName } from "@/lib/client-name";
import { sendAppointmentEmail } from "@/lib/email";
import { shopToEmailConfig } from "@/lib/email-config";

function parseStartsAt(date: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const startsAt = new Date(`${date}T00:00:00`);
  startsAt.setHours(hours, minutes, 0, 0);
  return startsAt;
}

function getWeekRange(weekStart?: string) {
  const start = weekStart ? new Date(`${weekStart}T00:00:00`) : new Date();
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function formatAppointmentDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

export async function getAppointments(weekStart?: string) {
  const shopId = await getShopId();
  const { start, end } = getWeekRange(weekStart);

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

  return { appointments, weekStart: start.toISOString().split("T")[0], weekEnd: end };
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

  if (!appointment) redirect("/appointments");
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

  const parsed = appointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, mechanicId, title, date, time, durationMinutes, notes } =
    parsed.data;

  const startsAt = parseStartsAt(date, time);
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

  revalidatePath("/appointments");
  redirect(`/appointments?week=${getWeekRange(date).start.toISOString().split("T")[0]}`);
}

export async function updateAppointment(id: string, formData: AppointmentFormData) {
  const shopId = await getShopId();

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

  const startsAt = parseStartsAt(date, time);
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

  revalidatePath("/appointments");
  redirect(`/appointments?week=${getWeekRange(date).start.toISOString().split("T")[0]}`);
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

  revalidatePath("/appointments");
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
      startsAtFormatted: formatAppointmentDateTime(appointment.startsAt),
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

  revalidatePath("/appointments");
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
    startsAtFormatted: formatAppointmentDateTime(appointment.startsAt),
    shopPhone: appointment.shop.phone,
  });

  await db.appointment.update({
    where: { id },
    data: { cancellationSentAt: new Date() },
  });

  revalidatePath("/appointments");
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
    startsAtFormatted: formatAppointmentDateTime(appointment.startsAt),
    shopPhone: appointment.shop.phone,
  });

  await db.appointment.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

  return { success: true, sentTo: clientEmail };
}
