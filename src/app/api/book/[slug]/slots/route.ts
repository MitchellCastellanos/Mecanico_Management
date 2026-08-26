import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, getBookableDates, getDateWindow, getShopBySlug } from "@/lib/booking-slots";

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

  if (date) {
    // Sin filtro de mecánico: un horario aparece disponible en cuanto
    // cualquier mecánico del taller esté libre — el sitio no deja elegir uno.
    const slots = await getAvailableSlots(shop, date);
    return NextResponse.json({ slots });
  }

  // Tope de 90 días (3 meses) — coincide con el máximo que ya permite
  // Configuración → bookingAdvanceDays (ver booking-settings.ts).
  const windowDays = Math.min(shop.bookingAdvanceDays, 90);
  const availableDates = await getBookableDates(shop, windowDays);

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
  });
}
