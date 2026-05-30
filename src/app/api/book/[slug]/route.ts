import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findAvailableMechanic, getShopBySlug } from "@/lib/booking-slots";
import { formatClientName } from "@/lib/client-name";
import { sendAppointmentEmail } from "@/lib/email";
import { shopToEmailConfig } from "@/lib/email-config";
import { parseShopDateTime } from "@/lib/shop-timezone";
import { publicBookingSchema } from "@/lib/validations";

function formatAppointmentDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || !shop.bookingEnabled) {
    return NextResponse.json({ error: "Reservas no disponibles" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = publicBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const mechanic = await findAvailableMechanic(
    shop,
    data.date,
    data.time,
    data.mechanicId || undefined
  );

  if (!mechanic) {
    return NextResponse.json(
      { error: { time: ["Ese horario ya no está disponible. Elige otro."] } },
      { status: 409 }
    );
  }

  const startsAt = parseShopDateTime(data.date, data.time, shop.timezone);
  const endsAt = new Date(startsAt.getTime() + shop.bookingSlotMinutes * 60_000);

  const email = data.email.trim().toLowerCase();
  let client = await db.client.findFirst({
    where: { shopId: shop.id, email },
  });

  if (!client) {
    client = await db.client.create({
      data: {
        shopId: shop.id,
        firstName: data.firstName,
        lastName: data.lastName || null,
        email,
        phone: data.phone,
        notes: "Cliente creado desde reserva web",
      },
    });
  } else {
    await db.client.update({
      where: { id: client.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone,
      },
    });
  }

  let vehicle = await db.vehicle.findFirst({
    where: {
      clientId: client.id,
      licensePlate: { equals: data.licensePlate, mode: "insensitive" },
    },
  });

  if (!vehicle) {
    vehicle = await db.vehicle.create({
      data: {
        clientId: client.id,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate.toUpperCase(),
      },
    });
  }

  const appointment = await db.appointment.create({
    data: {
      shopId: shop.id,
      clientId: client.id,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      title: data.title,
      startsAt,
      endsAt,
      durationMinutes: shop.bookingSlotMinutes,
      notes: data.notes || null,
      status: "CONFIRMED",
      source: "PUBLIC_WEB",
    },
    include: { client: true, shop: true },
  });

  if (shop.appointmentEmailsEnabled && client.email) {
    try {
      await sendAppointmentEmail({
        shop: shopToEmailConfig(shop),
        to: client.email,
        type: "confirmation",
        clientName: formatClientName(client),
        title: appointment.title,
        startsAtFormatted: formatAppointmentDateTime(startsAt, shop.timezone),
        shopPhone: shop.phone,
      });
      await db.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSentAt: new Date() },
      });
    } catch (err) {
      console.error("[public-booking] confirmation email failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    appointmentId: appointment.id,
    mechanicName: mechanic.name,
    startsAt: startsAt.toISOString(),
  });
}
