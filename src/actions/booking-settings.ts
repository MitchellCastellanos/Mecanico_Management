"use server";

import { ADMIN, PLATFORM, adminPath } from "@/lib/routes";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { DEFAULT_WORKING_HOURS, getShopServiceCatalog } from "@/lib/booking-slots";
import { getPublicBookingUrl, isValidShopSlug, slugifyShopName } from "@/lib/shop-slug";
import { BRAND } from "@/config/brand";
import { DAY_LABELS, type WorkingHoursRow } from "@/lib/working-hours";
import { SERVICE_KEYS } from "@/lib/service-catalog";
import { SITE_DICTIONARIES } from "@/lib/site-locale";
import { z } from "zod";

export async function getAppointmentBookingSettings() {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: { workingHours: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!shop) return null;

  const mechanics = await db.user.findMany({
    where: {
      shopId,
      role: { in: ["MECHANIC", "OWNER"] },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, bookable: true },
  });

  let workingHours: WorkingHoursRow[] = DEFAULT_WORKING_HOURS.map((row) => ({
    ...row,
    dayLabel: DAY_LABELS[row.dayOfWeek],
  }));

  if (shop.workingHours.length > 0) {
    workingHours = shop.workingHours.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      dayLabel: DAY_LABELS[row.dayOfWeek],
      openTime: row.openTime,
      closeTime: row.closeTime,
      isClosed: row.isClosed,
    }));
  }

  const mechanicHoursRows = await db.mechanicWorkingHours.findMany({
    where: { userId: { in: mechanics.map((m) => m.id) } },
    orderBy: { dayOfWeek: "asc" },
  });

  const mechanicsWithHours = mechanics.map((mechanic) => {
    const rows = mechanicHoursRows.filter((r) => r.userId === mechanic.id);
    const usesShopHours = rows.length === 0;
    const hours: WorkingHoursRow[] = usesShopHours
      ? workingHours
      : workingHours.map((shopRow) => {
          const row = rows.find((r) => r.dayOfWeek === shopRow.dayOfWeek);
          return row
            ? {
                dayOfWeek: row.dayOfWeek,
                dayLabel: DAY_LABELS[row.dayOfWeek],
                openTime: row.openTime,
                closeTime: row.closeTime,
                isClosed: row.isClosed,
              }
            : { ...shopRow, isClosed: true };
        });

    return { ...mechanic, usesShopHours, workingHours: hours };
  });

  const slug = shop.slug ?? BRAND.bookingSlug;

  return {
    shop: {
      slug: shop.slug,
      suggestedSlug: slug,
      bookingEnabled: shop.bookingEnabled,
      timezone: shop.timezone,
      bookingSlotMinutes: shop.bookingSlotMinutes,
      bookingLeadTimeHours: shop.bookingLeadTimeHours,
      bookingAdvanceDays: shop.bookingAdvanceDays,
      bookingUrl: shop.slug ? getPublicBookingUrl(shop.slug) : null,
    },
    workingHours,
    mechanics: mechanicsWithHours,
  };
}

const bookingSettingsSchema = z.object({
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  bookingEnabled: z.coerce.boolean(),
  bookingSlotMinutes: z.coerce.number().int().min(15).max(240),
  bookingLeadTimeHours: z.coerce.number().int().min(1).max(168),
  bookingAdvanceDays: z.coerce.number().int().min(1).max(90),
});

export async function updateAppointmentBookingSettings(formData: FormData) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const parsed = bookingSettingsSchema.safeParse({
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    bookingEnabled: formData.get("bookingEnabled") === "on",
    bookingSlotMinutes: formData.get("bookingSlotMinutes"),
    bookingLeadTimeHours: formData.get("bookingLeadTimeHours"),
    bookingAdvanceDays: formData.get("bookingAdvanceDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { slug, bookingEnabled, bookingSlotMinutes, bookingLeadTimeHours, bookingAdvanceDays } =
    parsed.data;

  if (!isValidShopSlug(slug)) {
    return { error: { slug: ["Formato de enlace inválido"] } };
  }

  const taken = await db.shop.findFirst({
    where: { slug, NOT: { id: shopId } },
  });
  if (taken) {
    return { error: { slug: ["Este enlace ya está en uso por otro taller"] } };
  }

  await db.shop.update({
    where: { id: shopId },
    data: {
      slug,
      bookingEnabled,
      bookingSlotMinutes,
      bookingLeadTimeHours,
      bookingAdvanceDays,
    },
  });

  revalidatePath(ADMIN.settings);
  return { success: true, bookingUrl: getPublicBookingUrl(slug) };
}

const timeRegex = /^\d{2}:\d{2}$/;

export async function updateShopWorkingHours(formData: FormData) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const rows: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[] = [];

  for (let day = 0; day <= 6; day++) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    const openTime = (formData.get(`open_${day}`) as string) || "08:00";
    const closeTime = (formData.get(`close_${day}`) as string) || "17:00";

    if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
      return { error: { _form: [`Horario inválido para ${DAY_LABELS[day]}`] } };
    }

    rows.push({ dayOfWeek: day, openTime, closeTime, isClosed });
  }

  await db.$transaction([
    db.shopWorkingHours.deleteMany({ where: { shopId } }),
    db.shopWorkingHours.createMany({
      data: rows.map((row) => ({
        id: crypto.randomUUID(),
        shopId,
        ...row,
      })),
    }),
  ]);

  revalidatePath(ADMIN.settings);
  return { success: true };
}

export async function updateMechanicBookable(userId: string, bookable: boolean) {
  const session = await requireOwner();

  const user = await db.user.findFirst({
    where: {
      id: userId,
      shopId: session.user.shopId,
      role: { in: ["MECHANIC", "OWNER"] },
    },
  });

  if (!user) return { error: "Mecánico no encontrado" };

  await db.user.update({ where: { id: userId }, data: { bookable } });
  revalidatePath(ADMIN.settings);
  return { success: true };
}

/**
 * Ajuste de arranque para la reserva en línea: deja la ventana en 90 días,
 * marca como reservable al mecánico indicado, y le asigna todas las citas
 * del taller que todavía no tienen mecánico — sin eso esas citas no
 * bloquean horarios en el sitio público y se podría reservar encima de
 * ellas. Seguro de correr más de una vez (no duplica nada).
 *
 * IMPORTANTE: recibe explícitamente a quién asignar — nunca asumas que es
 * quien está logueado. Una cuenta OWNER puede ser de soporte/plataforma
 * (no un mecánico real del taller), y asignarle citas a ciegas rompe el
 * calendario público.
 */
export async function fixOnlineBookingAvailability(targetMechanicId: string) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const shop = await db.shop.findUnique({ where: { id: shopId } });
  if (!shop) return { error: "Taller no encontrado" };

  const target = await findShopMechanic(targetMechanicId, shopId);
  if (!target) return { error: "Mecánico no encontrado" };

  const advanceDaysUpdated = shop.bookingAdvanceDays !== 90;
  if (advanceDaysUpdated) {
    await db.shop.update({ where: { id: shopId }, data: { bookingAdvanceDays: 90 } });
  }

  const madeBookable = !target.bookable;
  if (madeBookable) {
    await db.user.update({ where: { id: targetMechanicId }, data: { bookable: true } });
  }

  const { count: appointmentsAssigned } = await db.appointment.updateMany({
    where: { shopId, mechanicId: null },
    data: { mechanicId: targetMechanicId },
  });

  revalidatePath(ADMIN.settings);
  return { success: true, advanceDaysUpdated, madeBookable, appointmentsAssigned };
}

/**
 * Corrige una asignación equivocada: mueve todas las citas que quedaron a
 * nombre de un usuario (ej. una cuenta de soporte/plataforma usada por
 * error como mecánico) hacia el mecánico correcto.
 */
export async function reassignMechanicAppointments(fromUserId: string, toUserId: string) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  if (fromUserId === toUserId) {
    return { error: "Elige dos personas distintas" };
  }

  const [fromUser, toUser] = await Promise.all([
    db.user.findFirst({ where: { id: fromUserId, shopId } }),
    findShopMechanic(toUserId, shopId),
  ]);

  if (!fromUser) return { error: "Usuario de origen no encontrado" };
  if (!toUser) return { error: "Mecánico de destino no encontrado" };

  const { count: reassigned } = await db.appointment.updateMany({
    where: { shopId, mechanicId: fromUserId },
    data: { mechanicId: toUserId },
  });

  revalidatePath(ADMIN.settings);
  return { success: true, reassigned };
}

// ── DISPONIBILIDAD POR MECÁNICO ────────────────────────────────

async function findShopMechanic(userId: string, shopId: string) {
  return db.user.findFirst({
    where: { id: userId, shopId, role: { in: ["MECHANIC", "OWNER"] } },
  });
}

export async function updateMechanicWorkingHours(formData: FormData) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const userId = formData.get("userId") as string;
  if (!userId) return { error: { _form: ["Mecánico no especificado"] } };

  const mechanic = await findShopMechanic(userId, shopId);
  if (!mechanic) return { error: { _form: ["Mecánico no encontrado"] } };

  const rows: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[] = [];

  for (let day = 0; day <= 6; day++) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    const openTime = (formData.get(`open_${day}`) as string) || "08:00";
    const closeTime = (formData.get(`close_${day}`) as string) || "17:00";

    if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
      return { error: { _form: [`Horario inválido para ${DAY_LABELS[day]}`] } };
    }

    rows.push({ dayOfWeek: day, openTime, closeTime, isClosed });
  }

  await db.$transaction([
    db.mechanicWorkingHours.deleteMany({ where: { userId } }),
    db.mechanicWorkingHours.createMany({
      data: rows.map((row) => ({
        id: crypto.randomUUID(),
        userId,
        ...row,
      })),
    }),
  ]);

  revalidatePath(ADMIN.settings);
  return { success: true };
}

/** El mecánico vuelve a seguir el horario general del taller (borra su horario propio). */
export async function resetMechanicWorkingHours(userId: string) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const mechanic = await findShopMechanic(userId, shopId);
  if (!mechanic) return { error: "Mecánico no encontrado" };

  await db.mechanicWorkingHours.deleteMany({ where: { userId } });
  revalidatePath(ADMIN.settings);
  return { success: true };
}

// ── SERVICIOS DEL CALENDARIO PÚBLICO ────────────────────────────

/**
 * Catálogo de servicios del taller para /admin/settings: los defaults de
 * src/lib/service-catalog.ts (todos activos, con su duración de fábrica)
 * fusionados con lo que el taller haya guardado en ShopBookingService.
 */
export async function getServiceCatalogSettings() {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const catalog = await getShopServiceCatalog(shopId);
  const labels = SITE_DICTIONARIES.es.form.serviceOptions;

  return catalog.map((row) => ({
    ...row,
    label: labels.find((opt) => opt.value === row.key)?.label ?? row.key,
  }));
}

export async function updateServiceCatalog(formData: FormData) {
  const session = await requireOwner();
  const shopId = session.user.shopId!;

  const rows: { key: string; durationMinutes: number; isActive: boolean; sortOrder: number }[] = [];

  for (const [index, key] of SERVICE_KEYS.entries()) {
    const durationMinutes = Number(formData.get(`duration_${key}`));
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
      return { error: { _form: ["Duración inválida — debe estar entre 5 y 480 minutos"] } };
    }
    rows.push({
      key,
      durationMinutes,
      isActive: formData.get(`active_${key}`) === "on",
      sortOrder: index,
    });
  }

  await db.$transaction([
    db.shopBookingService.deleteMany({ where: { shopId } }),
    db.shopBookingService.createMany({
      data: rows.map((row) => ({ id: crypto.randomUUID(), shopId, ...row })),
    }),
  ]);

  revalidatePath(ADMIN.settings);
  return { success: true };
}
