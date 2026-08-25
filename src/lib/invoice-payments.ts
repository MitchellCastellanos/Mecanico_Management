import Decimal from "decimal.js";

export type InvoicePaymentMode = "CARD" | "CASH" | "MIXED";

export type PaymentEntryInput = {
  method: "CARD" | "CASH";
  amount: number;
  /** Path en Supabase, subido vía POST /api/invoices/[id]/payment-receipt */
  receiptPath?: string;
};

// El monto a cobrar siempre es el total de la factura: si es efectivo/interno,
// su total ya nació sin impuestos (revenueType decidido al crearla); si es
// tarjeta/declarada, el total ya incluye impuestos. El modo de pago elegido
// al cobrar (CARD/CASH/MIXED) es solo cómo se recibió el dinero, no cambia
// cuánto se debe cobrar.
export function paymentTargetAmount(total: string | number): Decimal {
  return new Decimal(total);
}

export function shouldSuppressTaxesOnPdf(
  revenueType: "OFFICIAL" | "INTERNAL_ONLY" | string | null | undefined
): boolean {
  return revenueType === "INTERNAL_ONLY";
}

/** Suma de montos registrados para ingresos / analytics. */
export function sumPaymentEntries(entries: { amount: string | number }[]): number {
  return entries
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
}

/** Etiquetas: Tarjeta #1, Efectivo #1, etc. (mismo orden que sortOrder). */
export function labelPaymentEntries(
  entries: { method: "CARD" | "CASH" | string }[]
): string[] {
  let cardN = 0;
  let cashN = 0;
  return entries.map((e) => {
    if (e.method === "CARD") {
      cardN += 1;
      return `Tarjeta #${cardN}`;
    }
    cashN += 1;
    return `Efectivo #${cashN}`;
  });
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
