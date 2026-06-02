"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendInvoiceByEmail } from "@/actions/invoices";
import { EMAIL_PENDING_CONFIRM_MESSAGE } from "@/lib/invoice-status";
import { Loader2, Mail, Send, X } from "lucide-react";
import { FileAttachmentButtons } from "@/components/ui/FileAttachmentButtons";

interface InvoiceSendDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  clientEmail: string;
  isResend: boolean;
  requiresPendingConfirm?: boolean;
  disabled?: boolean;
  /** Comprobantes de terminal que se adjuntan automáticamente al enviar. */
  paymentReceiptCount?: number;
}

const MAX_EMAIL_EXTRAS = 10;

export function InvoiceSendDialog({
  invoiceId,
  invoiceNumber,
  clientEmail,
  isResend,
  requiresPendingConfirm = false,
  disabled,
  paymentReceiptCount = 0,
}: InvoiceSendDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const maxUserFiles = Math.max(0, MAX_EMAIL_EXTRAS - paymentReceiptCount);

  function addFiles(incoming: File[]) {
    const merged = [...files, ...incoming].slice(0, maxUserFiles);
    if (files.length + incoming.length > maxUserFiles) {
      toast.error(
        maxUserFiles === 0
          ? "Los comprobantes de pago ya ocupan el límite de adjuntos del correo"
          : `Máximo ${maxUserFiles} archivo(s) extra en este envío`
      );
    }
    setFiles(merged);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function openDialog() {
    if (requiresPendingConfirm && !confirm(EMAIL_PENDING_CONFIRM_MESSAGE)) {
      return;
    }
    setOpen(true);
  }

  function handleSend() {
    startTransition(async () => {
      const formData = new FormData();
      files.forEach((f) => formData.append("attachments", f));

      const result = await sendInvoiceByEmail(invoiceId, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.isResend
          ? `Factura reenviada a ${result.sentTo}`
          : `Factura enviada a ${result.sentTo}`
      );
      setOpen(false);
      setFiles([]);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openDialog}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {isResend ? <Send className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
        {isResend ? "Reenviar por email" : "Enviar por email"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {isResend ? "Reenviar factura" : "Enviar factura"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {invoiceNumber} → {clientEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setFiles([]);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                La factura PDF se adjunta automáticamente.
                {paymentReceiptCount > 0 && (
                  <>
                    {" "}
                    También se incluyen {paymentReceiptCount} comprobante(s) de terminal
                    registrados al pagar.
                  </>
                )}{" "}
                Aquí puedes agregar documentos extra si lo necesitas.
              </p>

              <div className="flex flex-wrap gap-2">
                <FileAttachmentButtons
                  disabled={pending || maxUserFiles === 0}
                  onFilesSelected={addFiles}
                />
              </div>

              {files.length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span className="truncate text-slate-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-red-500 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-slate-400">
                PDF o imágenes · Máx. {maxUserFiles} archivo(s) extra · 5 MB c/u
                {paymentReceiptCount > 0 &&
                  ` · ${paymentReceiptCount} comprobante(s) de pago incluidos automáticamente`}
              </p>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setFiles([]);
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSend}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {pending ? "Enviando…" : "Enviar ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
