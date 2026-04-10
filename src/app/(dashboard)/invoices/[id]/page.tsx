import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getInvoiceById } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const ITEM_TYPE_LABEL: Record<string, string> = {
  LABOUR: "Mano de obra",
  PART: "Repuesto",
  OTHER: "Otro",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  const taxPct = (parseFloat(invoice.taxRate.toString()) * 100).toFixed(3);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[invoice.status] ?? "bg-slate-100 text-slate-500"}`}
              >
                {STATUS_LABEL[invoice.status] ?? invoice.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Emitida el {formatDate(invoice.issuedAt)}
              {invoice.dueAt && ` · Vence el ${formatDate(invoice.dueAt)}`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* PDF download */}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download={`${invoice.invoiceNumber}.pdf`}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar PDF</span>
          </a>
          {/* Status transitions con toast */}
          <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
        </div>
      </div>

      {/* Client + Vehicle info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Cliente
          </p>
          <p className="font-semibold text-slate-900">
            {invoice.client.firstName} {invoice.client.lastName}
          </p>
          {invoice.client.email && (
            <p className="text-sm text-slate-600 mt-1">{invoice.client.email}</p>
          )}
          {invoice.client.phone && (
            <p className="text-sm text-slate-600">{invoice.client.phone}</p>
          )}
          {invoice.client.address && (
            <p className="text-sm text-slate-500 mt-1">{invoice.client.address}</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Vehículo
          </p>
          <p className="font-semibold text-slate-900">
            {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Placa: {invoice.vehicle.licensePlate}
          </p>
          {(invoice.mileageIn || invoice.mileageOut) && (
            <div className="flex gap-4 mt-2">
              {invoice.mileageIn && (
                <p className="text-xs text-slate-500">
                  Entrada: {invoice.mileageIn.toLocaleString()} {invoice.vehicle.mileageUnit}
                </p>
              )}
              {invoice.mileageOut && (
                <p className="text-xs text-slate-500">
                  Salida: {invoice.mileageOut.toLocaleString()} {invoice.vehicle.mileageUnit}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Servicios y repuestos</h2>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_80px_110px_110px] gap-3 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase">
          <span>Descripción</span>
          <span>Tipo</span>
          <span className="text-right">Cant.</span>
          <span className="text-right">P. Unit.</span>
          <span className="text-right">Total</span>
        </div>

        <div className="divide-y divide-slate-100">
          {invoice.lineItems.map((item, i) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_80px_110px_110px] gap-3 px-5 py-3 items-center"
            >
              <p className="text-sm text-slate-900 font-medium">{item.description}</p>
              <p className="hidden sm:block text-sm text-slate-500">
                {ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}
              </p>
              <p className="hidden sm:block text-sm text-slate-700 text-right">
                {Number(item.quantity) % 1 === 0
                  ? Number(item.quantity)
                  : Number(item.quantity).toFixed(2)}
              </p>
              <p className="hidden sm:block text-sm text-slate-700 text-right">
                {formatCurrency(Number(item.unitPrice))}
              </p>
              <p className="text-sm font-semibold text-slate-900 text-right">
                {formatCurrency(Number(item.lineTotal))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Notas
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Totals */}
        <div className={`bg-white rounded-xl border border-slate-200 p-5 ${!invoice.notes ? "lg:col-start-2" : ""}`}>
          <h2 className="font-semibold text-slate-900 mb-4">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Impuestos ({taxPct}%)</span>
              <span className="text-slate-900">{formatCurrency(Number(invoice.taxAmount))}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
              <span className="font-semibold text-slate-900">Total CAD</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(Number(invoice.total))}
              </span>
            </div>
            {invoice.paidAt && (
              <p className="text-xs text-emerald-600 mt-2">
                Pagada el {formatDate(invoice.paidAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
