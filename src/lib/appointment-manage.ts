import { db } from "@/lib/db";
import { getShopBySlug } from "@/lib/booking-slots";

/** Estados de cita que el cliente todavía puede modificar. */
const EDITABLE_STATUSES = ["SCHEDULED", "CONFIRMED"] as const;

export async function getShopAndAppointmentByToken(slug: string, token: string) {
  const shop = await getShopBySlug(slug);
  if (!shop) return null;

  const appointment = await db.appointment.findFirst({
    where: { shopId: shop.id, manageToken: token },
    include: { client: true, vehicle: true, mechanic: { select: { id: true, name: true } } },
  });
  if (!appointment) return null;

  return { shop, appointment };
}

export function isAppointmentEditable(appointment: { status: string; startsAt: Date }): boolean {
  return (
    (EDITABLE_STATUSES as readonly string[]).includes(appointment.status) &&
    appointment.startsAt.getTime() > Date.now()
  );
}

/** Igual que checkMechanicConflict en actions/appointments.ts, sin sesión de admin. */
export async function checkPublicMechanicConflict(
  shopId: string,
  mechanicId: string,
  startsAt: Date,
  endsAt: Date,
  excludeId: string
): Promise<boolean> {
  const conflict = await db.appointment.findFirst({
    where: {
      shopId,
      mechanicId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      id: { not: excludeId },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  return Boolean(conflict);
}
