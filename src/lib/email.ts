// Wrapper para Resend — envío de emails transaccionales
// Resend free tier: 3,000 emails/mes, suficiente para Carlos.

import { Resend } from "resend";
import { ServiceReminderEmail } from "@/emails/ServiceReminderEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Mecanico <noreply@mecanico.app>",
    to: data.clientEmail,
    subject: `Recordatorio de servicio: ${data.serviceType} — ${data.vehicleDescription}`,
    react: element,
  });

  if (error) {
    throw new Error(`Error enviando email: ${error.message}`);
  }
}
