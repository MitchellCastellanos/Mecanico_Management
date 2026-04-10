// Wrapper para Resend — envío de emails transaccionales
// Resend free tier: 3,000 emails/mes, suficiente para Carlos.

import { Resend } from "resend";
import { ServiceReminderEmail } from "@/emails/ServiceReminderEmail";
import { AccountingNotificationEmail } from "@/emails/AccountingNotificationEmail";
import React from "react";

// Lazy: no instanciar en tiempo de carga del módulo — Resend lanza error
// si la API key no existe, lo que rompe el build de Next.js al evaluar módulos.
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "re_placeholder") {
    throw new Error("RESEND_API_KEY no está configurado");
  }
  return new Resend(key);
}

interface ReminderEmailData {
  clientName: string;
  clientEmail: string;
  vehicleDescription: string; // "2019 Honda Civic"
  licensePlate: string;
  serviceType: string;
  dueDate?: Date | null;
  dueMileage?: number | null;
  mileageUnit: string;
  shopName: string;
  shopPhone?: string | null;
  shopEmail?: string | null;
}

export async function sendReminderEmail(data: ReminderEmailData) {
  const element = React.createElement(ServiceReminderEmail, data);

  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "Mecanico <noreply@mecanico.app>",
    to: data.clientEmail,
    subject: `Recordatorio de servicio: ${data.serviceType} — ${data.vehicleDescription}`,
    react: element,
  });

  if (error) {
    throw new Error(`Error enviando email: ${error.message}`);
  }
}

// ── Notificación a la contadora ───────────────────────────────

interface AccountingEmailData {
  shopName: string;
  uploaderName: string;
  files: { fileName: string; category: string; driveUrl?: string }[];
  driveFolderUrl?: string;
}

export async function sendAccountantEmail(data: AccountingEmailData) {
  const to = process.env.ACCOUNTANT_EMAIL;
  if (!to) throw new Error("ACCOUNTANT_EMAIL no está configurado");

  const element = React.createElement(AccountingNotificationEmail, data);
  const fileCount = data.files.length;

  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "Mecanico <noreply@mecanico.app>",
    to,
    subject: `${data.shopName} — ${fileCount} documento${fileCount !== 1 ? "s" : ""} nuevo${fileCount !== 1 ? "s" : ""}`,
    react: element,
  });

  if (error) {
    throw new Error(`Error enviando email a contadora: ${error.message}`);
  }
}
