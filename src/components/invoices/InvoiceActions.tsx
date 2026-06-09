"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  cancelInvoice,
  deleteInvoice,
  revertInvoiceToPending,
} from "@/actions/invoices";
import { InvoiceSendDialog } from "@/components/invoices/InvoiceSendDialog";
import { InvoiceMarkPaidDialog } from "@/components/invoices/InvoiceMarkPaidDialog";
import { isInvoicePending } from "@/lib/invoice-status";
import { Ban, Trash2, RotateCcw, Mail, Loader2 } from "lucide-react";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  clientId: string;
  clientEmail?: string | null;
  emailSendCount?: number;
  subtotal?: number;
  total?: number;
  revenueType?: "OFFICIAL" | "INTERNAL_ONLY";
  isPaid?: boolean;
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
  subtotal = 0,
  total = 0,
  revenueType = "OFFICIAL",
  isPaid = false,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [cancelPending, startCancel] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [revertPendingPending, startRevertPending] = useTransition();

  const isAnyPending = cancelPending || deletePending || revertPendingPending;

  const hasClientEmail = Boolean(clientEmail?.trim());
  const canEmail = EMAILABLE.has(status) && hasClientEmail;
  const isResend = emailSendCount > 0;
  const isPending = isInvoicePending(status);

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
            <InvoiceSendDialog
              invoiceId={invoiceId}
              invoiceNumber={invoiceNumber}
              clientEmail={clientEmail!.trim()}
              isResend={isResend}
              requiresPendingConfirm={isPending}
              disabled={isAnyPending}
              isPaid={isPaid}
            />
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

      {isPending && (
        <InvoiceMarkPaidDialog
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          subtotal={subtotal}
          total={total}
          revenueType={revenueType}
          disabled={isAnyPending}
        />
      )}

      {status === "PAID" && (
        <button
          type="button"
          disabled={isAnyPending}
          onClick={() =>
            startRevertPending(async () => {
              const result = await revertInvoiceToPending(invoiceId);
              if (result?.error) {
                toast.error(result.error);
                return;
              }
              toast.info("Factura regresada a pendiente");
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {revertPendingPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          Regresar a pendiente
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
