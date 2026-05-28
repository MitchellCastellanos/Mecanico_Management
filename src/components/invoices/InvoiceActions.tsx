"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markInvoiceAsSent,
  markInvoiceAsPaid,
  cancelInvoice,
  deleteInvoice,
} from "@/actions/invoices";
import { FileText, Loader2, Ban, Trash2 } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

const VOIDABLE = new Set(["DRAFT", "SENT", "PAID", "OVERDUE"]);

export function InvoiceActions({ invoiceId, invoiceNumber, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [sentPending, startSent] = useTransition();
  const [paidPending, startPaid] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const isAnyPending = sentPending || paidPending || cancelPending || deletePending;

  function handleCancel() {
    if (
      !confirm(
        `¿Anular la factura ${invoiceNumber}? Dejará de contar como pagada o activa, pero permanecerá en el historial.`
      )
    ) {
      return;
    }
    startCancel(async () => {
      const result = await cancelInvoice(invoiceId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.info("Factura anulada");
      router.refresh();
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `¿Eliminar definitivamente ${invoiceNumber}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    startDelete(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
      {status === "DRAFT" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startSent(async () => {
              await markInvoiceAsSent(invoiceId);
              toast.success("Factura marcada como enviada");
              router.refresh();
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
              toast.success("Factura marcada como pagada");
              router.refresh();
            })
          }
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {paidPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Marcar como pagada
        </button>
      )}

      {VOIDABLE.has(status) && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {cancelPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Ban className="w-3.5 h-3.5" />
          )}
          Anular
        </button>
      )}

      <button
        type="button"
        disabled={isAnyPending}
        onClick={handleDelete}
        className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
      >
        {deletePending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Eliminar
      </button>
    </div>
  );
}
