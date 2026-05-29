"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  markInvoiceAsSent,
  markInvoiceAsPaid,
  cancelInvoice,
  deleteInvoice,
  revertInvoiceToDraft,
  revertInvoiceToSent,
  sendInvoiceByEmail,
} from "@/actions/invoices";
import { FileText, Loader2, Ban, Trash2, RotateCcw, Mail, Send } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  clientId: string;
  clientEmail?: string | null;
  emailSendCount?: number;
}

const VOIDABLE = new Set(["DRAFT", "SENT", "PAID", "OVERDUE"]);
const EMAILABLE = new Set(["DRAFT", "SENT", "PAID", "OVERDUE"]);

export function InvoiceActions({
  invoiceId,
  invoiceNumber,
  status,
  clientId,
  clientEmail,
  emailSendCount = 0,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [sentPending, startSent] = useTransition();
  const [emailPending, startEmail] = useTransition();
  const [paidPending, startPaid] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [revertDraftPending, startRevertDraft] = useTransition();
  const [revertSentPending, startRevertSent] = useTransition();

  const isAnyPending =
    sentPending ||
    emailPending ||
    paidPending ||
    cancelPending ||
    deletePending ||
    revertDraftPending ||
    revertSentPending;

  const hasClientEmail = Boolean(clientEmail?.trim());
  const canEmail = EMAILABLE.has(status) && hasClientEmail;
  const isResend = emailSendCount > 0;

  function handleSendEmail() {
    startEmail(async () => {
      const result = await sendInvoiceByEmail(invoiceId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result.isResend) {
        toast.success(`Factura reenviada a ${result.sentTo}`);
      } else {
        toast.success(`Factura enviada a ${result.sentTo}`);
      }
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
    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
      {EMAILABLE.has(status) && (
        <>
          {canEmail ? (
            <button
              type="button"
              disabled={isAnyPending}
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {emailPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isResend ? (
                <Send className="w-4 h-4" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {isResend ? "Reenviar por email" : "Enviar por email"}
            </button>
          ) : (
            <Link
              href={`/clients/${clientId}`}
              title="Agrega un email al cliente para enviar la factura"
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Sin email del cliente</span>
            </Link>
          )}
        </>
      )}

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
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {sentPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Marcar enviada (sin email)
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

      {status === "SENT" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startRevertDraft(async () => {
              const result = await revertInvoiceToDraft(invoiceId);
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              toast.info("Factura regresada a borrador");
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {revertDraftPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Regresar a borrador
        </button>
      )}

      {status === "PAID" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startRevertSent(async () => {
              const result = await revertInvoiceToSent(invoiceId);
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              toast.info("Factura regresada a enviada");
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {revertSentPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Regresar a enviada
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
