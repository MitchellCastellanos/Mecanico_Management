// Envío de notificaciones de citas: SMS (canal principal) + email (secundario).
// Centraliza la lógica usada por acciones admin, reserva pública y el cron de recordatorios.

import { getAppUrl } from "@/lib/app-url";
import { formatClientName } from "@/lib/client-name";
import { formatShopDateTime } from "@/lib/shop-timezone";
import { sendAppointmentEmail } from "@/lib/email";
import { sendAppointmentSms, type AppointmentSmsType } from "@/lib/sms";
import { shopToEmailConfig, type ShopEmailConfig } from "@/lib/email-config";

export type AppointmentNotificationType = AppointmentSmsType;

export interface AppointmentNotifyShop extends ShopEmailConfig {
  name: string;
  phone: string | null;
  timezone: string;
  slug: string | null;
  appointmentEmailsEnabled: boolean;
  appointmentSmsEnabled: boolean;
}

export interface AppointmentNotifyClient {
  firstName: string;
  lastName?: string | null;
  email: string | null;
  phone: string | null;
  /** Idioma preferido — determina el idioma del SMS y del email. Por defecto español. */
  language?: string | null;
}

interface NotifyAppointmentEventParams {
  type: AppointmentNotificationType;
  shop: AppointmentNotifyShop;
  client: AppointmentNotifyClient;
  appointmentId: string;
  title: string;
  startsAt: Date;
  manageToken: string | null;
}

export interface NotifyAppointmentEventResult {
  smsSent: boolean;
  emailSent: boolean;
  anySent: boolean;
}

/** Link público para que el cliente edite/cancele su cita (null si el taller no tiene slug o no hay token). */
export function buildAppointmentManageUrl(
  shop: { slug: string | null },
  manageToken: string | null
): string | null {
  if (!shop.slug || !manageToken) return null;
  return `${getAppUrl()}/book/${shop.slug}/manage/${manageToken}`;
}

/** Intenta SMS (principal) y email (secundario) de forma independiente; ninguno bloquea al otro. */
export async function notifyAppointmentEvent(
  params: NotifyAppointmentEventParams
): Promise<NotifyAppointmentEventResult> {
  const startsAtFormatted = formatShopDateTime(params.startsAt, params.shop.timezone);
  const manageUrl = buildAppointmentManageUrl(params.shop, params.manageToken);

  let smsSent = false;
  const phone = params.client.phone?.trim();
  if (params.shop.appointmentSmsEnabled && phone) {
    try {
      await sendAppointmentSms({
        type: params.type,
        to: phone,
        shopName: params.shop.name,
        title: params.title,
        startsAtFormatted,
        language: params.client.language,
        manageUrl,
      });
      smsSent = true;
    } catch (err) {
      console.error(`[appointment-sms] ${params.type} falló (${params.appointmentId}):`, err);
    }
  }

  let emailSent = false;
  const email = params.client.email?.trim();
  if (params.shop.appointmentEmailsEnabled && email) {
    try {
      await sendAppointmentEmail({
        shop: shopToEmailConfig(params.shop),
        to: email,
        type: params.type,
        clientName: formatClientName(params.client),
        title: params.title,
        startsAtFormatted,
        shopPhone: params.shop.phone,
        language: params.client.language,
        manageUrl,
      });
      emailSent = true;
    } catch (err) {
      console.error(`[appointment-email] ${params.type} falló (${params.appointmentId}):`, err);
    }
  }

  return { smsSent, emailSent, anySent: smsSent || emailSent };
}
