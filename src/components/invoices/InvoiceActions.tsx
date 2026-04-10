"use client";

// Botones de cambio de estado de factura con toast feedback.
// Se extraen a un Client Component para poder llamar toast() tras la acción.

import { useTransition } from "react";
import { toast } from "sonner";
import { markInvoiceAsSent, markInvoiceAsPaid, cancelInvoice } from "@/actions/invoices";
import { FileText, Loader2 } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const [sentPending, startSent] = useTransition();
  const [paidPending, startPaid] = useTransition();
  const [cancelPending, startCancel] = useTransition();

  const isAnyPending = sentPending || paidPending || cancelPending;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {status === "DRAFT" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startSent(async () => {
              await markInvoiceAsSent(invoiceId);
              toast.success("Factura marcada como enviada");
            })
          }
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {sentPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Marcar como enviada
        </button>
      )}

      {status === "SENT" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startPaid(async () => {
              await markInvoiceAsPaid(invoiceId);
              toast.success("Factura marcada como pagada ✓");
            })
          }
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {paidPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Marcar como pagada
        </button>
      )}

      {(status === "DRAFT" || status === "SENT") && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startCancel(async () => {
              await cancelInvoice(invoiceId);
              toast.info("Factura cancelada");
            })
          }
          className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {cancelPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancelar"}
        </button>
      )}
    </div>
  );
}
