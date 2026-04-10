import Link from "next/link";
import { Users, Plus } from "lucide-react";

// Fase 1 — placeholder, se construye completo en la Fase 1
export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión de clientes y vehículos
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay clientes registrados</p>
        <p className="text-slate-400 text-sm mt-1">
          Agrega tu primer cliente para comenzar
        </p>
        <Link
          href="/clients/new"
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar cliente
        </Link>
      </div>
    </div>
  );
}
