import { FolderOpen } from "lucide-react";

export default function AccountingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contabilidad</h1>
        <p className="text-slate-500 text-sm mt-1">
          Envía documentos a tu contadora directamente a Google Drive
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">
          Módulo de documentos contables
        </p>
        <p className="text-slate-400 text-sm mt-1">
          Se implementa en la Fase 4 — integración con Google Drive
        </p>
      </div>
    </div>
  );
}
