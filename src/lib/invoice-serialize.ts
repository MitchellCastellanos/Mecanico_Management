import type { Prisma } from "@prisma/client";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true;
    vehicle: true;
    lineItems: true;
    shop: true;
  };
}>;

/** Serializa Decimals de Prisma para generateInvoicePdf / InvoiceDocument. */
export function serializeInvoiceForPdf(invoice: InvoiceWithRelations) {
  return {
    ...invoice,
    subtotal: invoice.subtotal.toString(),
    taxRate: invoice.taxRate.toString(),
    taxAmount: invoice.taxAmount.toString(),
    total: invoice.total.toString(),
    lineItems: invoice.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
  };
}
