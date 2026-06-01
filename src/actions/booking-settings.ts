"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { DEFAULT_WORKING_HOURS } from "@/lib/booking-slots";
import { getPublicBookingUrl, isValidShopSlug, slugifyShopName } from "@/lib/shop-slug";
import { BRAND } from "@/config/brand";
import { DAY_LABELS, type WorkingHoursRow } from "@/lib/working-hours";
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
    mechanics,
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

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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
  revalidatePath("/settings");
  return { success: true };
}
