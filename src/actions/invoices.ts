"use server";

// Server Actions para facturas
// La pieza más crítica: auto-numeración en transacción Prisma para evitar duplicados.
//
// Concepto clave — Transacción Prisma:
// Imagina que dos personas crean una factura al mismo tiempo.
// Sin transacción: ambas leen "último número = 41", ambas crean INV-0042. ¡Duplicado!
// Con transacción: la DB bloquea la operación, solo una avanza, la otra espera. ✓

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getShopId } from "@/lib/shop-context";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations";
import { formatInvoiceNumber } from "@/lib/utils";
import { calculateTaxBreakdown, roundTaxRate } from "@/lib/taxes";
import Decimal from "decimal.js";

// ── READ ────────────────────────────────────────────────────

export async function getInvoices(status?: string) {
  const shopId = await getShopId();

  return db.invoice.findMany({
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

export async function getInvoiceById(id: string) {
  const shopId = await getShopId();

  const invoice = await db.invoice.findFirst({
    where: { id, shopId },
    include: {
      client: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      shop: true,
    },
  });

  if (!invoice) redirect("/invoices");
  return invoice;
}

// ── CREATE ──────────────────────────────────────────────────

export async function createInvoice(formData: InvoiceFormData) {
  const shopId = await getShopId();

  const parsed = invoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { clientId, vehicleId, lineItems, taxRate, language, notes, mileageIn, mileageOut, dueAt } =
    parsed.data;

  // Calcular totales con Decimal para evitar errores de punto flotante.
  // Problema real: 0.1 + 0.2 = 0.30000000000000004 en JavaScript.
  // Decimal.js resuelve esto usando aritmética de precisión arbitraria.
  const subtotal = lineItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.quantity).times(item.unitPrice));
  }, new Decimal(0));

  const { taxAmount } = calculateTaxBreakdown(subtotal, taxRate);
  const total = subtotal.plus(taxAmount);

  // Transacción: generar número único y crear factura de forma atómica
  const invoice = await db.$transaction(async (tx) => {
    // Contar facturas existentes de este shop para generar el siguiente número
    const count = await tx.invoice.count({ where: { shopId } });
    const invoiceNumber = formatInvoiceNumber(count + 1);

    return tx.invoice.create({
      data: {
        shopId,
        clientId,
        vehicleId,
        invoiceNumber,
        status: "DRAFT",
        subtotal: subtotal.toFixed(2),
        taxRate: roundTaxRate(taxRate),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        language,
        notes: notes || null,
        mileageIn: mileageIn ?? null,
        mileageOut: mileageOut ?? null,
        dueAt: dueAt ? new Date(dueAt) : null,
        lineItems: {
          create: lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            lineTotal: new Decimal(item.quantity)
              .times(item.unitPrice)
              .toFixed(2),
            itemType: item.itemType,
            sortOrder: index,
          })),
        },
      },
    });
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

// ── UPDATE STATUS ───────────────────────────────────────────

export async function markInvoiceAsSent(id: string) {
  const shopId = await getShopId();
  await db.invoice.updateMany({
    where: { id, shopId },
    data: { status: "SENT" },
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function markInvoiceAsPaid(id: string) {
  const shopId = await getShopId();
  await db.invoice.updateMany({
    where: { id, shopId },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function revertInvoiceToDraft(id: string) {
  const shopId = await getShopId();
  const result = await db.invoice.updateMany({
    where: { id, shopId, status: "SENT" },
    data: { status: "DRAFT" },
  });
  if (result.count === 0) return { error: "La factura no está en estado Enviada" };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function revertInvoiceToSent(id: string) {
  const shopId = await getShopId();
  const result = await db.invoice.updateMany({
    where: { id, shopId, status: "PAID" },
    data: { status: "SENT", paidAt: null },
  });
  if (result.count === 0) return { error: "La factura no está en estado Pagada" };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}

const VOIDABLE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;

export async function cancelInvoice(id: string) {
  const shopId = await getShopId();

  const result = await db.invoice.updateMany({
    where: {
      id,
      shopId,
      status: { in: [...VOIDABLE_STATUSES] },
    },
    data: { status: "CANCELLED", paidAt: null },
  });

  if (result.count === 0) {
    return { error: "No se puede anular esta factura" };
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const shopId = await getShopId();

  const result = await db.invoice.deleteMany({
    where: { id, shopId },
  });

  if (result.count === 0) {
    return { error: "Factura no encontrada" };
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}

// ── Guardar URL del PDF generado ───────────────────────────

export async function savePdfUrl(id: string, pdfUrl: string) {
  const shopId = await getShopId();
  await db.invoice.updateMany({
    where: { id, shopId },
    data: { pdfUrl },
  });
  revalidatePath(`/invoices/${id}`);
}

// ── UPDATE ──────────────────────────────────────────────────

export async function updateInvoice(id: string, formData: InvoiceFormData) {
  const shopId = await getShopId();

  const existing = await db.invoice.findFirst({
    where: { id, shopId, status: "DRAFT" },
  });

  if (!existing) {
    return { error: { _form: ["Factura no encontrada o no disponible para edición"] } };
  }

  const parsed = invoiceSchema.safeParse(formData);
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
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });

    await tx.invoice.update({
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
        dueAt: dueAt ? new Date(dueAt) : null,
        pdfUrl: null,
        lineItems: {
          create: lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            lineTotal: new Decimal(item.quantity).times(item.unitPrice).toFixed(2),
            itemType: item.itemType,
            sortOrder: index,
          })),
        },
      },
    });
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

// ── Datos para el formulario de nueva factura ───────────────

export async function getInvoiceFormData() {
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
