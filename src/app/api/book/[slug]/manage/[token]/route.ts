import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ADMIN } from "@/lib/routes";
import {
  checkPublicMechanicConflict,
  getShopAndAppointmentByToken,
  isAppointmentEditable,
} from "@/lib/appointment-manage";
import { parseShopDateTime } from "@/lib/shop-timezone";
import { publicAppointmentEditSchema } from "@/lib/validations";
import { notifyAppointmentEvent } from "@/lib/appointment-notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const found = await getShopAndAppointmentByToken(slug, token);

  if (!found) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const { shop, appointment } = found;

  if (!isAppointmentEditable(appointment)) {
    return NextResponse.json(
      { error: "Esta cita ya no se puede editar" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = publicAppointmentEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, date, time, mechanicId, notes } = parsed.data;

  const startsAt = parseShopDateTime(date, time, shop.timezone);
  const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60_000);

  if (startsAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: { time: ["Elige una fecha y hora futuras"] } },
      { status: 400 }
    );
  }

  if (mechanicId) {
    const hasConflict = await checkPublicMechanicConflict(
      shop.id,
      mechanicId,
      startsAt,
      endsAt,
      appointment.id
    );
    if (hasConflict) {
      return NextResponse.json(
        { error: { time: ["Ese horario ya no está disponible. Elige otro."] } },
        { status: 409 }
      );
    }
  }

  const updated = await db.appointment.update({
    where: { id: appointment.id },
    data: {
      title,
      startsAt,
      endsAt,
      mechanicId: mechanicId || null,
      notes: notes || null,
    },
    include: { client: true },
  });

  await notifyAppointmentEvent({
    type: "update",
    shop,
    client: appointment.client,
    appointmentId: appointment.id,
    title: updated.title,
    startsAt,
    manageToken: token,
  });

  revalidatePath(ADMIN.appointments);

  return NextResponse.json({
    ok: true,
    startsAt: startsAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const found = await getShopAndAppointmentByToken(slug, token);

  if (!found) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const { shop, appointment } = found;

  if (!isAppointmentEditable(appointment)) {
    return NextResponse.json(
      { error: "Esta cita ya no se puede cancelar" },
      { status: 409 }
    );
  }

  await db.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  const notified = await notifyAppointmentEvent({
    type: "cancellation",
    shop,
    client: appointment.client,
    appointmentId: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    manageToken: token,
  });

  if (notified.anySent) {
    await db.appointment.update({
      where: { id: appointment.id },
      data: { cancellationSentAt: new Date() },
    });
  }

  revalidatePath(ADMIN.appointments);

  return NextResponse.json({ ok: true });
}
