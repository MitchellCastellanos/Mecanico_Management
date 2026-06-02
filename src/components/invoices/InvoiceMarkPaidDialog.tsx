"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Decimal from "decimal.js";
import { markInvoiceAsPaid } from "@/actions/invoices";
import {
  paymentTargetAmount,
  type InvoicePaymentMode,
  type PaymentEntryInput,
} from "@/lib/invoice-payments";
import { formatCurrency } from "@/lib/utils";
import { FileAttachmentButtons } from "@/components/ui/FileAttachmentButtons";
import { Loader2, X, CreditCard, Banknote, Split, Trash2 } from "lucide-react";

interface InvoiceMarkPaidDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  subtotal: number;
  total: number;
  disabled?: boolean;
}

type LocalEntry = PaymentEntryInput & {
  id: string;
  receiptFile?: File;
};

const MODES: {
  value: InvoicePaymentMode;
  label: string;
  hint: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: "CARD",
    label: "Tarjeta",
    hint: "Con impuestos · comprobante de terminal por cada cobro",
    icon: CreditCard,
  },
  {
    value: "CASH",
    label: "Efectivo",
    hint: "Sin impuestos en la factura · cuenta en ingresos del negocio",
    icon: Banknote,
  },
  {
    value: "MIXED",
    label: "Ambos",
    hint: "El total a cubrir incluye impuestos",
    icon: Split,
  },
];

export function InvoiceMarkPaidDialog({
  invoiceId,
  invoiceNumber,
  subtotal,
  total,
  disabled,
}: InvoiceMarkPaidDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InvoicePaymentMode>("CARD");
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [draftMethod, setDraftMethod] = useState<"CARD" | "CASH">("CARD");
  const [draftAmount, setDraftAmount] = useState("");
  const [pending, startTransition] = useTransition();

  const target = useMemo(
    () => paymentTargetAmount(mode, subtotal, total),
    [mode, subtotal, total]
  );

  const paidSoFar = useMemo(
    () => entries.reduce((s, e) => s.plus(e.amount), new Decimal(0)),
    [entries]
  );

  const remaining = target.minus(paidSoFar);

  function resetDraftForMode(nextMode: InvoicePaymentMode) {
    setMode(nextMode);
    setEntries([]);
    setDraftMethod(nextMode === "CASH" ? "CASH" : "CARD");
    setDraftAmount("");
  }

  function addEntry() {
    const amount = parseFloat(draftAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    const method =
      mode === "CASH" ? "CASH" : mode === "CARD" ? "CARD" : draftMethod;

    const id = `${Date.now()}-${Math.random()}`;
    setEntries((prev) => [
      ...prev,
      {
        id,
        method,
        amount,
        receiptIndex: method === "CARD" ? prev.filter((e) => e.method === "CARD").length : undefined,
      },
    ]);
    setDraftAmount("");
  }

  function attachReceipt(entryId: string, files: File[]) {
    const file = files[0];
    if (!file) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, receiptFile: file } : e))
    );
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleSubmit() {
    if (!remaining.isZero()) {
      toast.error(`Falta por registrar ${formatCurrency(remaining.toNumber())}`);
      return;
    }

    const cardEntries = entries.filter((e) => e.method === "CARD");
    for (const e of cardEntries) {
      if (!e.receiptFile) {
        toast.error("Cada cobro con tarjeta requiere el comprobante de la terminal");
        return;
      }
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("paymentMode", mode);
      const payload: PaymentEntryInput[] = entries.map((e) => ({
        method: e.method,
        amount: e.amount,
      }));
      formData.append("entries", JSON.stringify(payload));

      let cardIdx = 0;
      for (const e of entries) {
        if (e.method === "CARD" && e.receiptFile) {
          formData.append(`receipt_${cardIdx}`, e.receiptFile);
          cardIdx++;
        }
      }

      const result = await markInvoiceAsPaid(invoiceId, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Factura marcada como pagada");
      setOpen(false);
      setEntries([]);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null}
        Marcar como pagada
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Registrar pago</h2>
                <p className="text-sm text-slate-500 mt-1">{invoiceNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEntries([]);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total a cubrir</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(target.toNumber())}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-600">Registrado</span>
                  <span className="text-emerald-700 font-medium">
                    {formatCurrency(paidSoFar.toNumber())}
                  </span>
                </div>
                <div className="flex justify-between mt-1 border-t border-slate-200 pt-2">
                  <span className="font-medium text-slate-800">Falta</span>
                  <span
                    className={
                      remaining.isZero()
                        ? "font-bold text-emerald-600"
                        : "font-bold text-amber-700"
                    }
                  >
                    {formatCurrency(Math.max(0, remaining.toNumber()))}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  Forma de pago
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    const active = mode === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => resetDraftForMode(m.value)}
                        className={[
                          "text-left p-3 rounded-lg border text-sm transition-colors",
                          active
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:border-slate-300",
                        ].join(" ")}
                      >
                        <Icon
                          className={`w-4 h-4 mb-1 ${active ? "text-emerald-600" : "text-slate-400"}`}
                        />
                        <p className="font-medium text-slate-900">{m.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{m.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === "MIXED" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftMethod("CARD")}
                    className={`flex-1 py-2 rounded-lg text-sm border ${
                      draftMethod === "CARD"
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMethod("CASH")}
                    className={`flex-1 py-2 rounded-lg text-sm border ${
                      draftMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Efectivo
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draftAmount}
                    onChange={(e) => setDraftAmount(e.target.value)}
                    placeholder="Monto"
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addEntry}
                  disabled={remaining.lte(0)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
                >
                  Agregar
                </button>
              </div>

              {entries.length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {entries.map((e) => (
                    <li key={e.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {e.method === "CARD" ? "Tarjeta" : "Efectivo"} ·{" "}
                            {formatCurrency(e.amount)}
                          </p>
                          {e.method === "CARD" && (
                            <p className="text-xs text-slate-500">
                              {e.receiptFile
                                ? `Comprobante: ${e.receiptFile.name}`
                                : "Falta comprobante de terminal"}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEntry(e.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {e.method === "CARD" && !e.receiptFile && (
                        <FileAttachmentButtons
                          onFilesSelected={(files) => attachReceipt(e.id, files)}
                          multiple={false}
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          uploadLabel="Subir comprobante"
                          cameraLabel="Foto comprobante"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setEntries([]);
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending || !remaining.isZero() || entries.length === 0}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
