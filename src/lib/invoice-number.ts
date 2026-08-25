import type { Prisma } from "@prisma/client";
import { formatDocumentNumber } from "@/lib/utils";
import type { RevenueType } from "@/lib/revenue-analytics";

// Serie de folio separada por tipo — así los declarados (tarjeta) quedan
// consecutivos entre sí, sin huecos dejados por facturas internas (efectivo).
// OFFICIAL conserva el prefijo histórico para no romper la numeración ya
// entregada a clientes/contabilidad; INTERNAL_ONLY arranca una serie propia.
const INVOICE_PREFIX: Record<RevenueType, string> = {
  OFFICIAL: "INV",
  INTERNAL_ONLY: "EF",
};

const QUOTE_PREFIX: Record<RevenueType, string> = {
  OFFICIAL: "COT",
  INTERNAL_ONLY: "COT-EF",
};

function sequencePattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}-(\\d+)$`, "i");
}

function maxSequence(numbers: string[], pattern: RegExp): number {
  let max = 0;
  for (const n of numbers) {
    const m = n.trim().match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/** Siguiente número de factura dentro de la serie de su tipo (efectivo/interno vs tarjeta/declarado). */
export async function allocateNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  shopId: string,
  revenueType: RevenueType
): Promise<string> {
  const prefix = INVOICE_PREFIX[revenueType];
  const rows = await tx.invoice.findMany({
    where: { shopId, invoiceNumber: { startsWith: `${prefix}-` } },
    select: { invoiceNumber: true },
  });
  const next = maxSequence(
    rows.map((r) => r.invoiceNumber),
    sequencePattern(prefix)
  );
  return formatDocumentNumber(next + 1, prefix);
}

/** Siguiente número de cotización dentro de la serie de su tipo. */
export async function allocateNextQuoteNumber(
  tx: Prisma.TransactionClient,
  shopId: string,
  revenueType: RevenueType
): Promise<string> {
  const prefix = QUOTE_PREFIX[revenueType];
  const rows = await tx.quote.findMany({
    where: { shopId, quoteNumber: { startsWith: `${prefix}-` } },
    select: { quoteNumber: true },
  });
  const next = maxSequence(
    rows.map((r) => r.quoteNumber),
    sequencePattern(prefix)
  );
  return formatDocumentNumber(next + 1, prefix);
}

export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
