import type { Prisma } from "@prisma/client";

type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    client: true;
    vehicle: true;
    lineItems: true;
    shop: true;
  };
}>;

export function serializeQuoteForPdf(quote: QuoteWithRelations) {
  return {
    ...quote,
    documentKind: "quote" as const,
    invoiceNumber: quote.quoteNumber,
    dueAt: quote.validUntil,
    subtotal: quote.subtotal.toString(),
    taxRate: quote.taxRate.toString(),
    taxAmount: quote.taxAmount.toString(),
    total: quote.total.toString(),
    status: quote.status,
    lineItems: quote.lineItems.map((item) => ({
      ...item,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
  };
}
