import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAvailableSlots,
  getBookableDates,
  getBookableMechanics,
  getShopBySlug,
} from "@/lib/booking-slots";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || !shop.bookingEnabled) {
    return NextResponse.json({ error: "Reservas no disponibles" }, { status: 404 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const mechanicId = req.nextUrl.searchParams.get("mechanicId") ?? undefined;

  // Al editar una cita existente, su propio horario no debe contarse como ocupado.
  const manageToken = req.nextUrl.searchParams.get("manageToken") ?? undefined;
  let excludeAppointmentId: string | undefined;
  if (manageToken) {
    const appointment = await db.appointment.findFirst({
      where: { shopId: shop.id, manageToken },
      select: { id: true },
    });
    excludeAppointmentId = appointment?.id;
  }

  if (date) {
    const slots = await getAvailableSlots(shop, date, mechanicId || undefined, excludeAppointmentId);
    return NextResponse.json({ slots });
  }

  const [dates, mechanics] = await Promise.all([
    getBookableDates(shop, 14, excludeAppointmentId),
    getBookableMechanics(shop.id),
  ]);

  return NextResponse.json({
    shop: {
      name: shop.name,
      phone: shop.phone,
      address: shop.address,
      logoUrl: shop.logoUrl,
      timezone: shop.timezone,
      bookingSlotMinutes: shop.bookingSlotMinutes,
    },
    dates,
    mechanics,
  });
}
