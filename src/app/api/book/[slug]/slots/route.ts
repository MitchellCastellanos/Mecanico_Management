import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableSlots,
  getBookableDates,
  getBookableMechanics,
  getDateWindow,
  getShopBySlug,
} from "@/lib/booking-slots";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    return NextResponse.json({ error: "Reservas no disponibles" }, { status: 404 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const mechanicId = req.nextUrl.searchParams.get("mechanicId") ?? undefined;

  if (date) {
    const slots = await getAvailableSlots(shop, date, mechanicId || undefined);
    return NextResponse.json({ slots });
  }

  // Tope de 60 días aunque el taller configure una ventana más larga —
  // evita disparar cientos de consultas de disponibilidad en un solo request.
  const windowDays = Math.min(shop.bookingAdvanceDays, 60);

  const [availableDates, mechanics] = await Promise.all([
    getBookableDates(shop, windowDays),
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
    dates: getDateWindow(shop, windowDays),
    availableDates,
    mechanics,
  });
}
