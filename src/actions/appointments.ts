"use server";

import { ADMIN } from "@/lib/routes";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getShopId } from "@/lib/shop-context";
import { appointmentSchema, appointmentEditSchema, type AppointmentEditFormData, type AppointmentFormData } from "@/lib/validations";
import { generateAppointmentManageToken, ensureAppointmentManageToken } from "@/lib/appointment-token";
import { notifyAppointmentEvent, type NotifyAppointmentEventResult } from "@/lib/appointment-notify";
import { buildAppointmentManageUrl } from "@/lib/appointment-notify";
import { BRAND } from "@/config/brand";
import { sortClientsByName } from "@/lib/client-name";
import {
  type AppointmentView,
  addShopDays,
  currentShopDate,
  formatShopDate,
  formatShopTime,
  getDayRangeShop,
  getMonthRange,
  getWeekRangeShop,
  monthFromDate,
  parseShopDateTime,
  shiftMonth,
} from "@/lib/shop-timezone";

/** Traduce el resultado de notifyAppointmentEvent a etiquetas legibles para la UI admin. */
function describeChannels(result: NotifyAppointmentEventResult): string[] {
  const channels: string[] = [];
  if (result.smsSent) channels.push("SMS");
  if (result.emailSent) channels.push("email");
  return channels;
}

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

/**
 * Mecánicos que aceptan citas (mismo criterio que la reserva web). `keepId`
 * conserva al mecánico ya asignado al editar, aunque hoy no acepte citas.
 */
export async function getMechanics(keepId?: string | null) {
  const shopId = await getShopId();

  return db.user.findMany({
    where: {
      shopId,
      role: { in: ["MECHANIC", "OWNER"] },
      OR: [{ bookable: true }, ...(keepId ? [{ id: keepId }] : [])],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

const MECHANIC_NOT_ACCEPTING = "Este mecánico no acepta citas";

async function acceptsAppointments(shopId: string, mechanicId: string): Promise<boolean> {
  const mechanic = await db.user.findFirst({
    where: { id: mechanicId, shopId, role: { in: ["MECHANIC", "OWNER"] }, bookable: true },
    select: { id: true },
  });
  return Boolean(mechanic);
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

export async function getAppointmentFormData(currentMechanicId?: string | null) {
  const shopId = await getShopId();

  const [clients, mechanics] = await Promise.all([
    db.client.findMany({
      where: { shopId },
      include: { vehicles: true },
    }),
    getMechanics(currentMechanicId),
  ]);

  return { clients: sortClientsByName(clients), mechanics };
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

/** Verificación en vivo desde el formulario (fecha/hora tal como las escribe el admin, en zona del taller). */
export async function checkMechanicConflictForForm(input: {
  mechanicId: string;
  date: string;
  time: string;
  durationMinutes: number;
  excludeId?: string;
}): Promise<boolean> {
  const { mechanicId, date, time, durationMinutes, excludeId } = input;
  if (!mechanicId || !date || !time || !(durationMinutes > 0)) return false;

  const shopId = await getShopId();
  const timeZone = await getShopTimezone(shopId);
  const startsAt = parseStartsAt(date, time, timeZone);
  if (Number.isNaN(startsAt.getTime())) return false;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return checkMechanicConflict(mechanicId, startsAt, endsAt, excludeId);
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
    if (!(await acceptsAppointments(shopId, mechanicId))) {
      return { error: { mechanicId: [MECHANIC_NOT_ACCEPTING] } };
    }
    const hasConflict = await checkMechanicConflict(mechanicId, startsAt, endsAt);
    if (hasConflict) {
      return { error: { mechanicId: ["El mecánico ya tiene otra cita en ese horario"] } };
    }
  }

  const manageToken = generateAppointmentManageToken();

  const appointment = await db.appointment.create({
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
      manageToken,
    },
    include: { client: true, shop: true },
  });

  // Misma confirmación inmediata que la reserva web (SMS + email). El resultado
  // viaja en la URL para que el admin vea por qué canal salió y lo valide con el cliente.
  let notified = "none";
  if (appointment.client.phone?.trim() || appointment.client.email?.trim()) {
    try {
      const result = await notifyAppointmentEvent({
        type: "confirmation",
        shop: appointment.shop,
        client: appointment.client,
        appointmentId: appointment.id,
        title: appointment.title,
        startsAt: appointment.startsAt,
        manageToken,
      });
      if (result.anySent) {
        await db.appointment.update({
          where: { id: appointment.id },
          data: { confirmationSentAt: new Date(), status: "CONFIRMED" },
        });
        notified = [result.smsSent && "sms", result.emailSent && "email"]
          .filter(Boolean)
          .join(",");
      } else {
        notified = "failed";
      }
    } catch (err) {
      console.error(`Error enviando confirmación de cita ${appointment.id}:`, err);
      notified = "failed";
    }
  } else {
    notified = "nocontact";
  }

  revalidatePath(ADMIN.appointments);
  redirect(`${ADMIN.appointments}?view=day&date=${date}&notified=${notified}`);
}

export async function updateAppointment(id: string, formData: AppointmentEditFormData) {
  const shopId = await getShopId();
  const timeZone = await getShopTimezone(shopId);

  const existing = await db.appointment.findFirst({
    where: { id, shopId },
  });

  if (!existing) {
    return { error: { _form: ["Cita no encontrada"] } };
  }

  const parsed = appointmentEditSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, mechanicId, title, date, time, durationMinutes, notes, status } =
    parsed.data;

  const startsAt = parseStartsAt(date, time, timeZone);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  if (mechanicId && status !== "CANCELLED" && status !== "NO_SHOW") {
    // Solo se exige al cambiar de mecánico: una cita ya asignada no se bloquea.
    if (mechanicId !== existing.mechanicId && !(await acceptsAppointments(shopId, mechanicId))) {
      return { error: { mechanicId: [MECHANIC_NOT_ACCEPTING] } };
    }
    const hasConflict = await checkMechanicConflict(mechanicId, startsAt, endsAt, id);
    if (hasConflict) {
      return { error: { mechanicId: ["El mecánico ya tiene otra cita en ese horario"] } };
    }
  }

  const updated = await db.appointment.update({
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
      status,
    },
    include: { client: true, shop: true },
  });

  // Igual que en la web: cancelar avisa al cliente; si cambia el horario se le
  // reenvía la confirmación con la nueva fecha.
  const becameCancelled = status === "CANCELLED" && existing.status !== "CANCELLED";
  const rescheduled =
    startsAt.getTime() !== existing.startsAt.getTime() &&
    (status === "SCHEDULED" || status === "CONFIRMED");

  let notified = "";
  if (becameCancelled || rescheduled) {
    const kind = becameCancelled ? "cancellation" : "confirmation";
    if (!updated.client.phone?.trim() && !updated.client.email?.trim()) {
      notified = "nocontact";
    } else {
      try {
        const manageToken = becameCancelled
          ? updated.manageToken
          : await ensureAppointmentManageToken(updated.id, updated.manageToken);
        const result = await notifyAppointmentEvent({
          type: kind,
          shop: updated.shop,
          client: updated.client,
          appointmentId: updated.id,
          title: updated.title,
          startsAt: updated.startsAt,
          manageToken,
        });
        if (result.anySent) {
          await db.appointment.update({
            where: { id },
            data: becameCancelled
              ? { cancellationSentAt: new Date() }
              : { confirmationSentAt: new Date(), status: "CONFIRMED" },
          });
          const channels = [result.smsSent && "sms", result.emailSent && "email"]
            .filter(Boolean)
            .join(",");
          notified = `${becameCancelled ? "cancel" : "update"}:${channels}`;
        } else {
          notified = "failed";
        }
      } catch (err) {
        console.error(`Error notificando cambio de cita ${id}:`, err);
        notified = "failed";
      }
    }
  }

  revalidatePath(ADMIN.appointments);
  redirect(
    `${ADMIN.appointments}?view=day&date=${date}${notified ? `&notified=${notified}` : ""}`
  );
}

export async function updateAppointmentStatus(id: string, status: AppointmentEditFormData["status"]) {
  const shopId = await getShopId();

  const existing = await db.appointment.findFirst({
    where: { id, shopId },
  });

  if (!existing) {
    return { error: "Cita no encontrada" };
  }

  const parsed = appointmentEditSchema.shape.status.safeParse(status);
  if (!parsed.success) {
    return { error: "Estado inválido" };
  }

  await db.appointment.update({
    where: { id },
    data: { status: parsed.data },
  });

  revalidatePath(ADMIN.appointments);
  return { success: true };
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

  if (appointment.client.phone || appointment.client.email) {
    try {
      await sendAppointmentCancellation(id);
    } catch (err) {
      console.error(`Error enviando cancelación de cita ${id}:`, err);
    }
  }

  revalidatePath(ADMIN.appointments);
  return { success: true };
}

export async function getAppointmentManageUrl(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { shop: { select: { slug: true } } },
  });

  if (!appointment) return null;

  const manageToken = await ensureAppointmentManageToken(
    appointment.id,
    appointment.manageToken
  );

  return buildAppointmentManageUrl(appointment.shop, manageToken);
}

// ── Notificaciones (SMS principal, email secundario) ──────────

export async function sendAppointmentConfirmation(id: string) {
  const shopId = await getShopId();

  const appointment = await db.appointment.findFirst({
    where: { id, shopId },
    include: { client: true, shop: true },
  });

  if (!appointment) {
    return { error: "Cita no encontrada" };
  }

  if (!appointment.client.phone?.trim() && !appointment.client.email?.trim()) {
    return { error: "El cliente no tiene teléfono ni email configurado" };
  }

  const manageToken = await ensureAppointmentManageToken(appointment.id, appointment.manageToken);

  const result = await notifyAppointmentEvent({
    type: "confirmation",
    shop: appointment.shop,
    client: appointment.client,
    appointmentId: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    manageToken,
  });

  if (!result.anySent) {
    return { error: "No se pudo enviar la confirmación (revisa la configuración de SMS/email)" };
  }

  await db.appointment.update({
    where: { id },
    data: {
      confirmationSentAt: new Date(),
      status: appointment.status === "SCHEDULED" ? "CONFIRMED" : appointment.status,
    },
  });

  revalidatePath(ADMIN.appointments);
  return { success: true, sentVia: describeChannels(result) };
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

  if (!appointment.client.phone?.trim() && !appointment.client.email?.trim()) {
    return { error: "El cliente no tiene teléfono ni email configurado" };
  }

  const result = await notifyAppointmentEvent({
    type: "cancellation",
    shop: appointment.shop,
    client: appointment.client,
    appointmentId: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    manageToken: appointment.manageToken,
  });

  if (!result.anySent) {
    return { error: "No se pudo enviar el aviso de cancelación" };
  }

  await db.appointment.update({
    where: { id },
    data: { cancellationSentAt: new Date() },
  });

  revalidatePath(ADMIN.appointments);
  return { success: true, sentVia: describeChannels(result) };
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

  if (!appointment.client.phone?.trim() && !appointment.client.email?.trim()) {
    return { error: "El cliente no tiene teléfono ni email configurado" };
  }

  const manageToken = await ensureAppointmentManageToken(appointment.id, appointment.manageToken);

  const result = await notifyAppointmentEvent({
    type: "reminder",
    shop: appointment.shop,
    client: appointment.client,
    appointmentId: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    manageToken,
  });

  if (!result.anySent) {
    return { error: "No se pudo enviar el recordatorio" };
  }

  await db.appointment.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

  return { success: true, sentVia: describeChannels(result) };
}

/** Para formulario de edición: fecha y hora en zona del taller */
export async function appointmentToFormValues(startsAt: Date, shopTimezone: string) {
  return {
    date: formatShopDate(startsAt, shopTimezone),
    time: formatShopTime(startsAt, shopTimezone),
  };
}

export { shiftMonth, addShopDays };
