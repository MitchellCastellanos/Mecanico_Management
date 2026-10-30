"use client";

import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { mergeClients } from "@/actions/clients";

interface Props {
  clientId: string;
  clientName: string;
  duplicates: { id: string; name: string; field: "phone" | "email" }[];
}

export function MergeDuplicatesBanner({ clientId, clientName, duplicates }: Props) {
  const [isPending, startTransition] = useTransition();
  if (duplicates.length === 0) return null;

  function merge(dupId: string, dupName: string) {
    if (
      !confirm(
        `¿Fusionar a ${dupName} dentro de ${clientName}? Sus vehículos, facturas, cotizaciones y citas pasarán a ${clientName} y el registro duplicado se eliminará. No se puede deshacer.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await mergeClients(clientId, dupId);
      if (result && "error" in result) alert(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-amber-900">Posible cliente duplicado</p>
          {duplicates.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-800">
              <span>
                <a href={`/clients/${d.id}`} className="font-medium underline">{d.name}</a> comparte{" "}
                {d.field === "phone" ? "el teléfono" : "el email"}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => merge(d.id, d.name)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {isPending ? "Fusionando..." : `Fusionar en ${clientName}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
