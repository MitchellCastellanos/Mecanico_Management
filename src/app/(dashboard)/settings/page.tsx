import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">
          Logo, datos del taller e impuestos
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Settings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Configuración del taller</p>
        <p className="text-slate-400 text-sm mt-1">Se implementa en la Fase 6</p>
      </div>
    </div>
  );
}
