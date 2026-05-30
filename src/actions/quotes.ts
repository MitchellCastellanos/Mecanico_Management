"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getShopId } from "@/lib/shop-context";
import { quoteSchema, type QuoteFormData } from "@/lib/validations";
import { formatQuoteNumber, formatInvoiceNumber, formatCurrency, formatDate } from "@/lib/utils";
import { calculateTaxBreakdown, roundTaxRate } from "@/lib/taxes";
import { serializeQuoteForPdf } from "@/lib/quote-serialize";
import { generateQuotePdf } from "@/lib/pdf";
import { sendQuoteEmail } from "@/lib/email";
import { shopToEmailConfig } from "@/lib/email-config";
import { parseEmailAttachments } from "@/lib/email-attachments";
import { syncSavedLineItems } from "@/actions/line-items";
import { formatClientName } from "@/lib/client-name";
import Decimal from "decimal.js";

// ── READ ────────────────────────────────────────────────────

export async function getQuotes(status?: string) {
  const shopId = await getShopId();

  return db.quote.findMany({
    where: {
      shopId,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
    },
    include: {
      client: true,
      vehicle: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteById(id: string) {
  const shopId = await getShopId();

  const quote = await db.quote.findFirst({
    where: { id, shopId },
    include: {
      client: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      shop: true,
    },
  });

  if (!quote) redirect("/quotes");
  return quote;
}

// ── CREATE ──────────────────────────────────────────────────

export async function createQuote(formData: QuoteFormData) {
  const shopId = await getShopId();

  const parsed = quoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, lineItems, taxRate, language, notes, mileageIn, mileageOut, dueAt } =
    parsed.data;

  const subtotal = lineItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.quantity).times(item.unitPrice));
  }, new Decimal(0));

  const { taxAmount } = calculateTaxBreakdown(subtotal, taxRate);
  const total = subtotal.plus(taxAmount);

  const quote = await db.$transaction(async (tx) => {
    const count = await tx.quote.count({ where: { shopId } });
    const quoteNumber = formatQuoteNumber(count + 1);

    return tx.quote.create({
      data: {
        shopId,
        clientId,
        vehicleId,
        quoteNumber,
        status: "DRAFT",
        subtotal: subtotal.toFixed(2),
        taxRate: roundTaxRate(taxRate),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        language,
        notes: notes || null,
        mileageIn: mileageIn ?? null,
        mileageOut: mileageOut ?? null,
        validUntil: dueAt ? new Date(dueAt) : null,
        lineItems: {
          create: lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            lineTotal: new Decimal(item.quantity).times(item.unitPrice).toFixed(2),
            itemType: item.itemType,
            warrantyTerm: item.warrantyTerm?.trim() || null,
            sortOrder: index,
          })),
        },
      },
    });
  });

  await syncSavedLineItems(shopId, lineItems);

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

// ── UPDATE ──────────────────────────────────────────────────

export async function updateQuote(id: string, formData: QuoteFormData) {
  const shopId = await getShopId();

  const existing = await db.quote.findFirst({
    where: { id, shopId, status: "DRAFT" },
  });

  if (!existing) {
    return { error: { _form: ["Cotización no encontrada o no disponible para edición"] } };
  }

  const parsed = quoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, lineItems, taxRate, language, notes, mileageIn, mileageOut, dueAt } =
    parsed.data;

  const subtotal = lineItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.quantity).times(item.unitPrice));
  }, new Decimal(0));

  const { taxAmount } = calculateTaxBreakdown(subtotal, taxRate);
  const total = subtotal.plus(taxAmount);

  await db.$transaction(async (tx) => {
    await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });

    await tx.quote.update({
      where: { id },
      data: {
        clientId,
        vehicleId,
        subtotal: subtotal.toFixed(2),
        taxRate: roundTaxRate(taxRate),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        language,
        notes: notes || null,
        mileageIn: mileageIn ?? null,
        mileageOut: mileageOut ?? null,
        validUntil: dueAt ? new Date(dueAt) : null,
        lineItems: {
          create: lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            lineTotal: new Decimal(item.quantity).times(item.unitPrice).toFixed(2),
            itemType: item.itemType,
            warrantyTerm: item.warrantyTerm?.trim() || null,
            sortOrder: index,
          })),
        },
      },
    });
  });

  await syncSavedLineItems(shopId, lineItems);

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${id}`);
}

// ── STATUS ──────────────────────────────────────────────────

export async function markQuoteAsSent(id: string) {
  const shopId = await getShopId();
  const quote = await db.quote.findFirst({ where: { id, shopId } });
  if (!quote) return;

  await db.quote.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: quote.sentAt ?? new Date(),
    },
  });
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

const EMAILABLE_STATUSES = ["DRAFT", "SENT", "ACCEPTED"] as const;

export async function sendQuoteByEmail(id: string, formData?: FormData) {
  const shopId = await getShopId();

  const quote = await db.quote.findFirst({
    where: { id, shopId },
    include: {
      client: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      shop: true,
    },
  });

  if (!quote) {
    return { error: "Cotización no encontrada" };
  }

  if (quote.status === "CANCELLED" || quote.status === "CONVERTED") {
    return { error: "No se puede enviar esta cotización" };
  }

  if (!EMAILABLE_STATUSES.includes(quote.status as (typeof EMAILABLE_STATUSES)[number])) {
    return { error: "Esta cotización no se puede enviar por email" };
  }

  const clientEmail = quote.client.email?.trim();
  if (!clientEmail) {
    return {
      error: "El cliente no tiene email. Agrégalo en su ficha antes de enviar la cotización.",
    };
  }

  const attachmentResult = await parseEmailAttachments(formData);
  if ("error" in attachmentResult) {
    return { error: attachmentResult.error };
  }

  const isResend = quote.emailSendCount > 0;
  const pdfBuffer = await generateQuotePdf(serializeQuoteForPdf(quote));
  const clientName = formatClientName(quote.client);
  const vehicleDescription = `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`;

  try {
    await sendQuoteEmail({
      shop: shopToEmailConfig(quote.shop),
      to: clientEmail,
      pdfBuffer,
      pdfFilename: `${quote.quoteNumber}.pdf`,
      extraAttachments: attachmentResult.attachments,
      clientName,
      shopName: quote.shop.name,
      shopPhone: quote.shop.phone,
      shopAddress: quote.shop.address,
      shopLogoUrl: quote.shop.logoUrl,
      quoteNumber: quote.quoteNumber,
      totalFormatted: formatCurrency(Number(quote.total)),
      vehicleDescription,
      validUntilFormatted: quote.validUntil ? formatDate(quote.validUntil) : null,
      language: quote.language,
      isResend,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error(`Error enviando cotización ${quote.quoteNumber}:`, err);
    return { error: message };
  }

  const now = new Date();
  await db.quote.update({
    where: { id },
    data: {
      status: quote.status === "DRAFT" ? "SENT" : quote.status,
      sentAt: quote.sentAt ?? now,
      emailSentAt: now,
      emailSendCount: { increment: 1 },
    },
  });

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");

  return {
    success: true,
    isResend,
    sentTo: clientEmail,
  };
}

export async function markQuoteAsAccepted(id: string) {
  const shopId = await getShopId();
  const result = await db.quote.updateMany({
    where: { id, shopId, status: { in: ["SENT", "DRAFT"] } },
    data: { status: "ACCEPTED" },
  });
  if (result.count === 0) return { error: "No se puede marcar como aceptada" };
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return { success: true };
}

export async function markQuoteAsRejected(id: string) {
  const shopId = await getShopId();
  const result = await db.quote.updateMany({
    where: { id, shopId, status: { in: ["SENT", "DRAFT"] } },
    data: { status: "REJECTED" },
  });
  if (result.count === 0) return { error: "No se puede marcar como rechazada" };
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return { success: true };
}

export async function convertQuoteToInvoice(id: string) {
  const shopId = await getShopId();

  const quote = await db.quote.findFirst({
    where: { id, shopId },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });

  if (!quote) {
    return { error: "Cotización no encontrada" };
  }

  if (quote.status === "CONVERTED") {
    return { error: "Esta cotización ya fue convertida a factura" };
  }

  if (quote.status === "CANCELLED" || quote.status === "REJECTED") {
    return { error: "No se puede convertir esta cotización" };
  }

  const invoice = await db.$transaction(async (tx) => {
    const count = await tx.invoice.count({ where: { shopId } });
    const invoiceNumber = formatInvoiceNumber(count + 1);

    const created = await tx.invoice.create({
      data: {
        shopId,
        clientId: quote.clientId,
        vehicleId: quote.vehicleId,
        invoiceNumber,
        status: "DRAFT",
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        language: quote.language,
        notes: quote.notes,
        mileageIn: quote.mileageIn,
        mileageOut: quote.mileageOut,
        dueAt: quote.validUntil,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            itemType: item.itemType,
            warrantyTerm: item.warrantyTerm,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });

    await tx.quote.update({
      where: { id },
      data: {
        status: "CONVERTED",
        convertedInvoiceId: created.id,
      },
    });

    return created;
  });

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

const VOIDABLE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;

export async function cancelQuote(id: string) {
  const shopId = await getShopId();

  const result = await db.quote.updateMany({
    where: {
      id,
      shopId,
      status: { in: [...VOIDABLE_STATUSES] },
    },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) {
    return { error: "No se puede anular esta cotización" };
  }

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  return { success: true };
}

export async function deleteQuote(id: string) {
  const shopId = await getShopId();

  const result = await db.quote.deleteMany({
    where: { id, shopId },
  });

  if (result.count === 0) {
    return { error: "Cotización no encontrada" };
  }

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect("/quotes");
}

// ── Form data ───────────────────────────────────────────────

export async function getQuoteFormData() {
  const shopId = await getShopId();

  const [clients, shop] = await Promise.all([
    db.client.findMany({
      where: { shopId },
      include: { vehicles: true },
      orderBy: { lastName: "asc" },
    }),
    db.shop.findUnique({ where: { id: shopId } }),
  ]);

  return { clients, shop };
}
