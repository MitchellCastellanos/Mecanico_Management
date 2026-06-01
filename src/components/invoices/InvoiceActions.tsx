"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  sendInvoiceByEmail,
  markInvoiceAsPaid,
  cancelInvoice,
  deleteInvoice,
} from "@/actions/invoices";
import { Mail, CheckCircle2, Loader2, Ban, Trash2, X } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  clientEmail?: string | null;
}

const VOIDABLE = new Set(["PENDING", "SENT", "PAID", "OVERDUE"]);
// Estados desde los que tiene sentido enviar/cobrar la factura.
const SENDABLE = new Set(["PENDING", "SENT", "OVERDUE"]);
const PAYABLE = new Set(["PENDING", "SENT", "OVERDUE"]);

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente de pago",
  SENT: "Enviada",
  OVERDUE: "Vencida",
};

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  clientEmail,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPending, startSend] = useTransition();
  const [paidPending, startPaid] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const isAnyPending = sendPending || paidPending || cancelPending || deletePending;
  const hasEmail = Boolean(clientEmail);

  function handleSend(markAsPaid: boolean) {
    startSend(async () => {
      const result = await sendInvoiceByEmail(invoiceId, markAsPaid);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setShowSendModal(false);
      toast.success(
        markAsPaid
          ? "Factura enviada y marcada como pagada"
          : "Factura enviada al cliente"
      );
      router.refresh();
    });
  }

  function handleMarkPaid() {
    if (!confirm(`¿Marcar la factura ${invoiceNumber} como pagada?`)) return;
    startPaid(async () => {
      await markInvoiceAsPaid(invoiceId);
      toast.success("Factura marcada como pagada");
      router.refresh();
    });
  }

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
    <>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        {SENDABLE.has(status) && (
          <button
            type="button"
            disabled={isAnyPending || !hasEmail}
            title={hasEmail ? undefined : "El cliente no tiene un correo registrado"}
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Enviar al cliente por email
          </button>
        )}

        {PAYABLE.has(status) && (
          <button
            type="button"
            disabled={isAnyPending}
            onClick={handleMarkPaid}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {paidPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
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

      {/* Modal de confirmación de envío: pendiente vs pagada */}
      {showSendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !sendPending && setShowSendModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setShowSendModal(false)}
              disabled={sendPending}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 pr-6">
              Enviar factura {invoiceNumber}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Esta factura está marcada como{" "}
              <span className="font-semibold text-amber-700">
                {STATUS_LABEL[status] ?? status}
              </span>
              . ¿Deseas enviarla con ese estado o marcarla como{" "}
              <span className="font-semibold text-emerald-700">Pagada</span> antes de enviar?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Se enviará a {clientEmail} con el PDF adjunto. Si la marcas como pagada, el PDF
              llevará una marca de agua &ldquo;Pagada&rdquo;.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={sendPending}
                onClick={() => handleSend(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {sendPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Marcar como pagada y enviar
              </button>
              <button
                type="button"
                disabled={sendPending}
                onClick={() => handleSend(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {sendPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Enviar como pendiente
              </button>
              <button
                type="button"
                disabled={sendPending}
                onClick={() => setShowSendModal(false)}
                className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
