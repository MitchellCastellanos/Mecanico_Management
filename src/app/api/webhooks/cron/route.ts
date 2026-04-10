import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

// Cron Job — corre diariamente a las 8am (configurado en vercel.json)
// Envía recordatorios de servicio con vencimiento en ≤7 días
//
// SEGURIDAD: protegido con CRON_SECRET header.
// Vercel añade automáticamente este header al llamar el endpoint.
// IDEMPOTENTE: verifica sentAt antes de enviar para evitar dobles envíos.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Solo recordatorios PENDING con fecha próxima, sin sentAt (no enviados aún)
  const dueReminders = await db.serviceReminder.findMany({
    where: {
      status: "PENDING",
      sentAt: null,
      dueDate: {
        lte: sevenDaysFromNow,
        gte: new Date(),
      },
    },
    include: {
      vehicle: {
        include: { client: true },
      },
      shop: true,
    },
  });

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const reminder of dueReminders) {
    const client = reminder.vehicle.client;

    // Saltar si el cliente no tiene email
    if (!client.email) {
      results.skipped++;
      continue;
    }

    try {
      await sendReminderEmail({
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        vehicleDescription: `${reminder.vehicle.year} ${reminder.vehicle.make} ${reminder.vehicle.model}`,
        licensePlate: reminder.vehicle.licensePlate,
        serviceType: reminder.serviceType,
        dueDate: reminder.dueDate,
        dueMileage: reminder.dueMileage,
        mileageUnit: reminder.vehicle.mileageUnit,
        shopName: reminder.shop.name,
        shopPhone: reminder.shop.phone,
        shopEmail: reminder.shop.email,
      });

      // Marcar como enviado (idempotencia: no se enviará de nuevo)
      await db.serviceReminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      results.sent++;
    } catch (err) {
      console.error(`Error enviando recordatorio ${reminder.id}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    ...results,
    message: `${results.sent} enviados, ${results.skipped} sin email, ${results.errors} errores`,
  });
}
