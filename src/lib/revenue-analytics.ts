import { getInvoiceRecordedRevenue } from "@/lib/invoice-payments";

export type RevenueType = "OFFICIAL" | "INTERNAL_ONLY";

export const REVENUE_TYPE_OPTIONS = [
  {
    value: "OFFICIAL" as const,
    label: "Ingreso oficial",
    helper:
      "Incluido en exportaciones para contabilidad y reportes oficiales.",
  },
  {
    value: "INTERNAL_ONLY" as const,
    label: "Solo interno",
    helper:
      "Visible en el panel del dueño y seguimiento de caja; no se exporta automáticamente a contabilidad.",
  },
] as const;

export function getInvoiceRevenueType(invoice: {
  revenueType?: RevenueType | string | null;
}): RevenueType {
  return invoice.revenueType === "INTERNAL_ONLY" ? "INTERNAL_ONLY" : "OFFICIAL";
}

export function isAccountantExportEligible(invoice: {
  revenueType?: RevenueType | string | null;
}): boolean {
  return getInvoiceRevenueType(invoice) === "OFFICIAL";
}

export function revenueTypeLabel(type: RevenueType): string {
  return REVENUE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

type PaidInvoiceForAnalytics = {
  status: string;
  revenueType?: RevenueType | string | null;
  paymentMode?: "CARD" | "CASH" | "MIXED" | null;
  recordedRevenue?: { toString(): string } | null;
  total: { toString(): string };
  paymentEntries?: { method: "CARD" | "CASH" | string; amount: { toString(): string } }[];
};

function entryAmount(entry: { amount: { toString(): string } }): number {
  return Number(entry.amount.toString());
}

function cashPortion(invoice: PaidInvoiceForAnalytics): number {
  const entries = invoice.paymentEntries ?? [];
  if (entries.length > 0) {
    return entries
      .filter((e) => e.method === "CASH")
      .reduce((sum, e) => sum + entryAmount(e), 0);
  }
  if (invoice.paymentMode === "CASH") {
    return getInvoiceRecordedRevenue(invoice);
  }
  return 0;
}

function cardPortion(invoice: PaidInvoiceForAnalytics): number {
  const entries = invoice.paymentEntries ?? [];
  if (entries.length > 0) {
    return entries
      .filter((e) => e.method === "CARD")
      .reduce((sum, e) => sum + entryAmount(e), 0);
  }
  if (invoice.paymentMode === "CARD" || invoice.paymentMode === "MIXED") {
    return getInvoiceRecordedRevenue(invoice);
  }
  return 0;
}

export type RevenueBreakdown = {
  totalRevenue: number;
  officialRevenue: number;
  internalRevenue: number;
  cardPayments: number;
  cashPayments: number;
  mixedPayments: number;
  officialCash: number;
  internalCash: number;
  officialCard: number;
  internalCard: number;
};

export function computeRevenueBreakdown(
  invoices: PaidInvoiceForAnalytics[]
): RevenueBreakdown {
  const paid = invoices.filter((inv) => inv.status === "PAID");
  const result: RevenueBreakdown = {
    totalRevenue: 0,
    officialRevenue: 0,
    internalRevenue: 0,
    cardPayments: 0,
    cashPayments: 0,
    mixedPayments: 0,
    officialCash: 0,
    internalCash: 0,
    officialCard: 0,
    internalCard: 0,
  };

  for (const inv of paid) {
    const revenue = getInvoiceRecordedRevenue(inv);
    const revenueType = getInvoiceRevenueType(inv);
    const cash = cashPortion(inv);
    const card = cardPortion(inv);

    result.totalRevenue += revenue;
    if (revenueType === "OFFICIAL") {
      result.officialRevenue += revenue;
      result.officialCash += cash;
      result.officialCard += card;
    } else {
      result.internalRevenue += revenue;
      result.internalCash += cash;
      result.internalCard += card;
    }

    if (inv.paymentMode === "MIXED") {
      result.mixedPayments += revenue;
    } else if (inv.paymentMode === "CASH") {
      result.cashPayments += revenue;
    } else if (inv.paymentMode === "CARD") {
      result.cardPayments += revenue;
    }
  }

  return result;
}
