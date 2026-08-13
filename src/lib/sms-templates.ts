// Plantillas de SMS de citas — texto puro, sin dependencias de servidor (Twilio, etc.).
// Se puede importar tanto desde el servidor (src/lib/sms.ts) como desde componentes de
// cliente que necesiten mostrar una vista previa exacta del mensaje antes de enviarlo.

export type AppointmentSmsType = "confirmation" | "reminder" | "cancellation" | "update";
export type SmsLanguage = "ES" | "EN" | "FR";

export interface AppointmentSmsBodyData {
  type: AppointmentSmsType;
  shopName: string;
  title: string;
  startsAtFormatted: string;
  /** Idioma preferido del cliente — por defecto español. */
  language?: SmsLanguage | string | null;
  /** Link para editar/cancelar la cita — se omite en cancelación. */
  manageUrl?: string | null;
}

type SmsCopyFn = (data: AppointmentSmsBodyData) => string;

const SMS_COPY: Record<SmsLanguage, Record<AppointmentSmsType, SmsCopyFn>> = {
  ES: {
    confirmation: (data) =>
      `${data.shopName}: cita confirmada — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Editar o cancelar: ${data.manageUrl}` : ""),
    reminder: (data) =>
      `${data.shopName}: recordatorio de tu cita — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Editar o cancelar: ${data.manageUrl}` : ""),
    cancellation: (data) =>
      `${data.shopName}: tu cita "${data.title}" del ${data.startsAtFormatted} fue cancelada.`,
    update: (data) =>
      `${data.shopName}: tu cita fue modificada — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Editar o cancelar: ${data.manageUrl}` : ""),
  },
  EN: {
    confirmation: (data) =>
      `${data.shopName}: appointment confirmed — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Edit or cancel: ${data.manageUrl}` : ""),
    reminder: (data) =>
      `${data.shopName}: reminder of your appointment — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Edit or cancel: ${data.manageUrl}` : ""),
    cancellation: (data) =>
      `${data.shopName}: your appointment "${data.title}" on ${data.startsAtFormatted} was cancelled.`,
    update: (data) =>
      `${data.shopName}: your appointment was updated — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Edit or cancel: ${data.manageUrl}` : ""),
  },
  FR: {
    confirmation: (data) =>
      `${data.shopName} : rendez-vous confirmé — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Modifier ou annuler : ${data.manageUrl}` : ""),
    reminder: (data) =>
      `${data.shopName} : rappel de votre rendez-vous — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Modifier ou annuler : ${data.manageUrl}` : ""),
    cancellation: (data) =>
      `${data.shopName} : votre rendez-vous « ${data.title} » du ${data.startsAtFormatted} a été annulé.`,
    update: (data) =>
      `${data.shopName} : votre rendez-vous a été modifié — ${data.title}, ${data.startsAtFormatted}.` +
      (data.manageUrl ? ` Modifier ou annuler : ${data.manageUrl}` : ""),
  },
};

export function resolveSmsLanguage(language?: string | null): SmsLanguage {
  return language === "EN" || language === "FR" ? language : "ES";
}

export function buildAppointmentSmsBody(data: AppointmentSmsBodyData): string {
  return SMS_COPY[resolveSmsLanguage(data.language)][data.type](data);
}
