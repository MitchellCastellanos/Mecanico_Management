import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cron Job — corre diariamente a las 8am (configurado en vercel.json)
// Envía recordatorios de servicio con vencimiento en ≤7 días
//
// SEGURIDAD: protegido con CRON_SECRET header
// Vercel añade automáticamente este header al llamar el endpoint
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Busca recordatorios pendientes con vencimiento próximo no enviados aún
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

  // TODO (Fase 3): enviar emails con Resend
  // for (const reminder of dueReminders) {
  //   await sendReminderEmail(reminder)
  //   await db.serviceReminder.update({ where: { id: reminder.id }, data: { sentAt: new Date(), status: "SENT" } })
  // }

  return NextResponse.json({
    processed: dueReminders.length,
    message: `${dueReminders.length} recordatorios procesados`,
  });
}
