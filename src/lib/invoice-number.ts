import type { Prisma } from "@prisma/client";
import { formatInvoiceNumber, formatQuoteNumber } from "@/lib/utils";

const INV_SEQ = /^INV-(\d+)$/i;
const COT_SEQ = /^COT-(\d+)$/i;

function maxSequence(numbers: string[], pattern: RegExp): number {
  let max = 0;
  for (const n of numbers) {
    const m = n.trim().match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/** Siguiente número de factura según el máximo existente (no el conteo de filas). */
export async function allocateNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  shopId: string
): Promise<string> {
  const rows = await tx.invoice.findMany({
    where: { shopId },
    select: { invoiceNumber: true },
  });
  const next = maxSequence(
    rows.map((r) => r.invoiceNumber),
    INV_SEQ
  );
  return formatInvoiceNumber(next + 1);
}

/** Siguiente número de cotización según el máximo existente. */
export async function allocateNextQuoteNumber(
  tx: Prisma.TransactionClient,
  shopId: string
): Promise<string> {
  const rows = await tx.quote.findMany({
    where: { shopId },
    select: { quoteNumber: true },
  });
  const next = maxSequence(
    rows.map((r) => r.quoteNumber),
    COT_SEQ
  );
  return formatQuoteNumber(next + 1);
}

export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
