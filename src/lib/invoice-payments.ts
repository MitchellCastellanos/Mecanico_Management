import Decimal from "decimal.js";

export type InvoicePaymentMode = "CARD" | "CASH" | "MIXED";

export type PaymentEntryInput = {
  method: "CARD" | "CASH";
  amount: number;
  /** Path en Supabase, subido vía POST /api/invoices/[id]/payment-receipt */
  receiptPath?: string;
};

/** Monto objetivo según modo de pago. */
export function paymentTargetAmount(
  mode: InvoicePaymentMode,
  subtotal: string | number,
  total: string | number
): Decimal {
  if (mode === "CASH") {
    return new Decimal(subtotal);
  }
  return new Decimal(total);
}

export function shouldSuppressTaxesOnPdf(mode: InvoicePaymentMode): boolean {
  return mode === "CASH";
}

/** Suma de montos registrados para ingresos / analytics. */
export function sumPaymentEntries(entries: { amount: string | number }[]): number {
  return entries
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
}

export function getInvoiceRecordedRevenue(invoice: {
  recordedRevenue?: { toString(): string } | null;
  total: { toString(): string };
  status: string;
}): number {
  if (invoice.status === "PAID" && invoice.recordedRevenue != null) {
    return Number(invoice.recordedRevenue.toString());
  }
  return Number(invoice.total.toString());
}
