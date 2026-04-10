import Link from "next/link";
import { Bell, Plus } from "lucide-react";

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recordatorios</h1>
          <p className="text-slate-500 text-sm mt-1">
            Avisos automáticos de servicio a clientes
          </p>
        </div>
        <Link
          href="/reminders/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo recordatorio
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay recordatorios</p>
        <p className="text-slate-400 text-sm mt-1">
          Los recordatorios se envían por email automáticamente
        </p>
      </div>
    </div>
  );
}
