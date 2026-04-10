import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Facturas seriadas y generación de PDF
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva factura
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay facturas todavía</p>
        <p className="text-slate-400 text-sm mt-1">
          Crea tu primera factura electrónica
        </p>
        <Link
          href="/invoices/new"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
        >
          <Plus className="w-4 h-4" />
          Crear factura
        </Link>
      </div>
    </div>
  );
}
