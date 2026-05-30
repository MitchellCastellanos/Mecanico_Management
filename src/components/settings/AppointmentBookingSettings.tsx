"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  updateAppointmentBookingSettings,
  updateMechanicBookable,
  updateShopWorkingHours,
} from "@/actions/booking-settings";
import type { WorkingHoursRow } from "@/lib/working-hours";
import { Copy, ExternalLink, Loader2 } from "lucide-react";

interface MechanicRow {
  id: string;
  name: string;
  role: string;
  bookable: boolean;
}

interface AppointmentBookingSettingsProps {
  shop: {
    slug: string | null;
    suggestedSlug: string;
    bookingEnabled: boolean;
    timezone: string;
    bookingSlotMinutes: number;
    bookingLeadTimeHours: number;
    bookingAdvanceDays: number;
    bookingUrl: string | null;
  };
  workingHours: WorkingHoursRow[];
  mechanics: MechanicRow[];
}

export function AppointmentBookingSettings({
  shop,
  workingHours,
  mechanics,
}: AppointmentBookingSettingsProps) {
  const [bookingPending, startBookingTransition] = useTransition();
  const [hoursPending, startHoursTransition] = useTransition();
  const [mechanicPending, startMechanicTransition] = useTransition();

  function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startBookingTransition(async () => {
      const result = await updateAppointmentBookingSettings(formData);
      if (result?.success) {
        toast.success("Configuración de reservas guardada");
      } else if (result?.error) {
        const msg = Object.values(result.error).flat()[0];
        toast.error(typeof msg === "string" ? msg : "Error al guardar");
      }
    });
  }

  function handleHoursSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startHoursTransition(async () => {
      const result = await updateShopWorkingHours(formData);
      if (result?.success) toast.success("Horario del taller guardado");
      else toast.error("Error al guardar horario");
    });
  }

  function toggleMechanicBookable(userId: string, bookable: boolean) {
    startMechanicTransition(async () => {
      const result = await updateMechanicBookable(userId, bookable);
      if (result?.success) toast.success(bookable ? "Mecánico visible en reservas" : "Mecánico oculto en reservas");
      else toast.error(result?.error ?? "Error");
    });
  }

  const previewUrl =
    shop.bookingUrl ??
    (shop.slug ? undefined : `…/book/${shop.suggestedSlug}`);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Citas — reservas desde el website</h2>
          <p className="text-sm text-slate-500 mt-1">
            Cuando entregues el sitio web del taller, enlaza a esta página pública para que los
            clientes agenden citas en línea. También puedes compartir el enlace directo.
          </p>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Enlace público (slug)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 shrink-0">/book/</span>
                <input
                  name="slug"
                  type="text"
                  defaultValue={shop.slug ?? shop.suggestedSlug}
                  required
                  pattern="[a-z0-9-]+"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Solo minúsculas, números y guiones. Ej: taller-carlos
              </p>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="bookingEnabled"
                name="bookingEnabled"
                type="checkbox"
                defaultChecked={shop.bookingEnabled}
                className="w-4 h-4 rounded border-slate-300 text-teal-600"
              />
              <label htmlFor="bookingEnabled" className="text-sm text-slate-700">
                Activar reservas en línea (visible en /book/…)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Duración de cada cita (min)
              </label>
              <input
                name="bookingSlotMinutes"
                type="number"
                min={15}
                step={15}
                defaultValue={shop.bookingSlotMinutes}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Anticipación mínima (horas)
              </label>
              <input
                name="bookingLeadTimeHours"
                type="number"
                min={1}
                max={168}
                defaultValue={shop.bookingLeadTimeHours}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reservar hasta (días adelante)
              </label>
              <input
                name="bookingAdvanceDays"
                type="number"
                min={1}
                max={90}
                defaultValue={shop.bookingAdvanceDays}
                className={inputClass}
              />
            </div>
            <div className="text-xs text-slate-400 flex items-end pb-2">
              Zona horaria: {shop.timezone}
            </div>
          </div>

          {shop.bookingUrl && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-teal-50 border border-teal-100 rounded-lg">
              <code className="text-xs text-teal-800 flex-1 break-all">{shop.bookingUrl}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shop.bookingUrl!);
                  toast.success("Enlace copiado");
                }}
                className="p-2 text-teal-700 hover:bg-teal-100 rounded-lg"
                title="Copiar enlace"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={shop.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-teal-700 hover:bg-teal-100 rounded-lg"
                title="Abrir página de reservas"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {!shop.bookingUrl && previewUrl && (
            <p className="text-xs text-slate-400">
              Al guardar con reservas activas, el enlace será: /book/{shop.suggestedSlug}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bookingPending}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              {bookingPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar reservas web
            </button>
          </div>
        </form>
      </div>

      <form
        onSubmit={handleHoursSubmit}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
      >
        <div>
          <h2 className="font-semibold text-slate-900">Horario de apertura</h2>
          <p className="text-sm text-slate-500 mt-1">
            Define cuándo el taller acepta citas. Los slots se generan dentro de este horario.
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {workingHours.map((row) => (
            <div
              key={row.dayOfWeek}
              className="flex flex-wrap items-center gap-3 p-3 bg-white"
            >
              <span className="w-24 text-sm font-medium text-slate-800">{row.dayLabel}</span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name={`closed_${row.dayOfWeek}`}
                  defaultChecked={row.isClosed}
                  className="rounded border-slate-300"
                />
                Cerrado
              </label>
              <input
                type="time"
                name={`open_${row.dayOfWeek}`}
                defaultValue={row.openTime}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
              />
              <span className="text-slate-400">—</span>
              <input
                type="time"
                name={`close_${row.dayOfWeek}`}
                defaultValue={row.closeTime}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={hoursPending}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
          >
            {hoursPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar horario
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Mecánicos disponibles para citas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Crea cuentas de mecánico en <strong>Equipo del taller</strong> (abajo). Aquí eliges quién
            aparece en el calendario de reservas y recibe citas automáticamente.
          </p>
        </div>

        {mechanics.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            No hay mecánicos. Ve a Equipo del taller y crea al menos un usuario con rol Mecánico.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {mechanics.map((m) => (
              <label
                key={m.id}
                className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.role === "OWNER" ? "Dueño" : "Mecánico"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Recibe citas web</span>
                  <input
                    type="checkbox"
                    defaultChecked={m.bookable}
                    disabled={mechanicPending}
                    onChange={(e) => toggleMechanicBookable(m.id, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600"
                  />
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";
