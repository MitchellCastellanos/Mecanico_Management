"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateServiceCatalog } from "@/actions/booking-settings";

/** "150" (min) → "2.5 h". Solo para el ojo — el valor real que se guarda siempre son minutos. */
function formatHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${hours.toFixed(2).replace(/0$/, "").replace(/\.$/, "")} h`;
}

interface ServiceCatalogRow {
  key: string;
  label: string;
  durationMinutes: number;
  isActive: boolean;
}

interface ServiceCatalogSettingsProps {
  services: ServiceCatalogRow[];
}

export function ServiceCatalogSettings({ services }: ServiceCatalogSettingsProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateServiceCatalog(formData);
      if (result?.success) toast.success("Servicios guardados");
      else {
        const msg = result?.error ? Object.values(result.error).flat()[0] : "Error al guardar";
        toast.error(typeof msg === "string" ? msg : "Error al guardar");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
    >
      <div>
        <h2 className="font-semibold text-slate-900">Servicios del calendario público</h2>
        <p className="text-sm text-slate-500 mt-1">
          Elige qué servicios aparecen para elegir en <strong>/book/…</strong> y cuánto dura cada
          uno — esa duración es la que bloquea el horario del mecánico. Desmarca un servicio para
          ocultarlo del sitio sin borrar su configuración.
        </p>
      </div>

      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <span className="w-8">Activo</span>
          <span className="flex-1">Servicio</span>
          <span className="w-44 text-right">Duración</span>
        </div>
        {services.map((service) => (
          <ServiceRow key={service.key} service={service} />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar servicios
        </button>
      </div>
    </form>
  );
}

function ServiceRow({ service }: { service: ServiceCatalogRow }) {
  const [minutes, setMinutes] = useState(service.durationMinutes);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white">
      <input
        type="checkbox"
        name={`active_${service.key}`}
        defaultChecked={service.isActive}
        className="w-4 h-4 rounded border-slate-300 text-teal-600"
      />
      <span className="flex-1 text-sm font-medium text-slate-800 min-w-[10rem]">
        {service.label}
      </span>
      <div className="flex items-center gap-2 w-44 justify-end">
        <input
          type="number"
          name={`duration_${service.key}`}
          min={5}
          max={480}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(e.target.valueAsNumber)}
          required
          className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right"
        />
        <span className="text-xs text-slate-400 w-6">min</span>
        <span className="text-xs text-slate-400 w-12 text-right">{formatHours(minutes)}</span>
      </div>
    </div>
  );
}
