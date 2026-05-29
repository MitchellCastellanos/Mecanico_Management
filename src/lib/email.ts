// Wrapper para Resend — envío de emails transaccionales
// Enrutamiento por canal: ver src/lib/email-config.ts y docs/EMAIL_MATRIX.md

import { Resend } from "resend";
import { ServiceReminderEmail } from "@/emails/ServiceReminderEmail";
import { AccountingNotificationEmail } from "@/emails/AccountingNotificationEmail";
import { InvoiceEmail, type InvoiceEmailProps } from "@/emails/InvoiceEmail";
import {
  resolveEmailRoute,
  type ShopEmailConfig,
  type EmailChannel,
} from "@/lib/email-config";
import { getInvoiceStrings, type InvoiceLanguage } from "@/lib/invoice-i18n";
import React from "react";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "re_placeholder") {
    throw new Error("RESEND_API_KEY no está configurado");
  }
  return new Resend(key);
}

interface TransactionalSendOptions {
  shop: ShopEmailConfig;
  channel: EmailChannel;
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  attachments?: { filename: string; content: Buffer }[];
}

async function sendTransactionalEmail(options: TransactionalSendOptions) {
  const route = resolveEmailRoute(options.shop, options.channel);

  if (route.pipeline !== "resend") {
    throw new Error(`El canal ${options.channel} no usa Resend`);
  }

  const { error } = await getResend().emails.send({
    from: route.from,
    replyTo: route.replyTo,
    to: options.to,
    subject: options.subject,
    react: options.react,
    attachments: options.attachments,
  });

  if (error) {
    throw new Error(`Error enviando email (${options.channel}): ${error.message}`);
  }
}

interface ReminderEmailData {
  shop: ShopEmailConfig;
  clientName: string;
  clientEmail: string;
  vehicleDescription: string;
  licensePlate: string;
  serviceType: string;
  dueDate?: Date | null;
  dueMileage?: number | null;
  mileageUnit: string;
  shopPhone?: string | null;
}

export async function sendReminderEmail(data: ReminderEmailData) {
  const route = resolveEmailRoute(data.shop, "REMINDER");

  const element = React.createElement(ServiceReminderEmail, {
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    vehicleDescription: data.vehicleDescription,
    licensePlate: data.licensePlate,
    serviceType: data.serviceType,
    dueDate: data.dueDate,
    dueMileage: data.dueMileage,
    mileageUnit: data.mileageUnit,
    shopName: data.shop.name,
    shopPhone: data.shopPhone,
    shopEmail: route.replyTo,
  });

  await sendTransactionalEmail({
    shop: data.shop,
    channel: "REMINDER",
    to: data.clientEmail,
    subject: `Recordatorio de servicio: ${data.serviceType} — ${data.vehicleDescription}`,
    react: element,
  });
}

interface AccountingEmailData {
  shop: ShopEmailConfig;
  uploaderName: string;
  files: { fileName: string; category: string; driveUrl?: string }[];
  driveFolderUrl?: string;
}

export async function sendAccountantEmail(data: AccountingEmailData) {
  const to = process.env.ACCOUNTANT_EMAIL?.trim();
  if (!to) throw new Error("ACCOUNTANT_EMAIL no está configurado");

  const element = React.createElement(AccountingNotificationEmail, {
    shopName: data.shop.name,
    uploaderName: data.uploaderName,
    files: data.files,
    driveFolderUrl: data.driveFolderUrl,
  });

  const fileCount = data.files.length;

  await sendTransactionalEmail({
    shop: data.shop,
    channel: "ACCOUNTING",
    to,
    subject: `${data.shop.name} — ${fileCount} documento${fileCount !== 1 ? "s" : ""} nuevo${fileCount !== 1 ? "s" : ""}`,
    react: element,
  });
}

interface InvoiceEmailSendData extends InvoiceEmailProps {
  shop: ShopEmailConfig;
  to: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailSendData) {
  const t = getInvoiceStrings(data.language as InvoiceLanguage).mail;
  const subject = data.isResend
    ? t.resendSubject(data.invoiceNumber, data.shopName)
    : t.subject(data.invoiceNumber, data.shopName);

  const route = resolveEmailRoute(data.shop, "INVOICE");
  const element = React.createElement(InvoiceEmail, {
    ...data,
    shopEmail: route.replyTo,
  });

  await sendTransactionalEmail({
    shop: data.shop,
    channel: "INVOICE",
    to: data.to,
    subject,
    react: element,
    attachments: [
      {
        filename: data.pdfFilename,
        content: data.pdfBuffer,
      },
    ],
  });
}
