// Wrapper para Twilio — envío de SMS transaccionales (citas)
// Requiere TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_FROM_NUMBER en el entorno.
// Ver docs/SMS_SETUP.md.

import twilio from "twilio";
import {
  buildAppointmentSmsBody,
  type AppointmentSmsBodyData,
  type AppointmentSmsType,
  type SmsLanguage,
} from "@/lib/sms-templates";

export type { AppointmentSmsType, SmsLanguage };

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio no está configurado (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  return twilio(accountSid, authToken);
}

/** Normaliza a E.164 asumiendo Norteamérica (+1) cuando no trae código de país. */
export function toE164(phone: string): string | null {
  const digits = phone.trim().replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    throw new Error("TWILIO_FROM_NUMBER no está configurado");
  }

  const e164 = toE164(to);
  if (!e164) {
    throw new Error(`Número de teléfono inválido para SMS: ${to}`);
  }

  const client = getTwilioClient();
  await client.messages.create({ to: e164, from, body });
}

export interface AppointmentSmsData extends AppointmentSmsBodyData {
  to: string;
}

export async function sendAppointmentSms(data: AppointmentSmsData): Promise<void> {
  const body = buildAppointmentSmsBody(data);
  await sendSms(data.to, body);
}
