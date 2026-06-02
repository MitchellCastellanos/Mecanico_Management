import type { Prisma } from "@prisma/client";
import { shouldSuppressTaxesOnPdf, type InvoicePaymentMode } from "@/lib/invoice-payments";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true;
    vehicle: true;
    lineItems: true;
    shop: true;
  };
}> & {
  paymentMode?: InvoicePaymentMode | null;
};

/** Serializa Decimals de Prisma para generateInvoicePdf / InvoiceDocument. */
export function serializeInvoiceForPdf(invoice: InvoiceWithRelations) {
  const suppressTaxes =
    invoice.paymentMode != null
      ? shouldSuppressTaxesOnPdf(invoice.paymentMode)
      : false;

  return {
    ...invoice,
    subtotal: invoice.subtotal.toString(),
    taxRate: invoice.taxRate.toString(),
    taxAmount: invoice.taxAmount.toString(),
    total: invoice.total.toString(),
    suppressTaxes,
    lineItems: invoice.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
  };
}
