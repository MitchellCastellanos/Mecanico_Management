"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Ban } from "lucide-react";

interface ShopInfo {
  phone: string | null;
  bookingSlotMinutes: number;
}

interface MechanicOption {
  id: string;
  name: string;
}

interface Slot {
  time: string;
  mechanicName: string;
}

interface InitialValues {
  title: string;
  date: string;
  time: string;
  mechanicId: string;
  notes: string;
}

interface ManageAppointmentFormProps {
  slug: string;
  token: string;
  shop: ShopInfo;
  initialValues: InitialValues;
}

export function ManageAppointmentForm({ slug, token, shop, initialValues }: ManageAppointmentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "saved" | "cancelled">("form");
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [title, setTitle] = useState(initialValues.title);
  const [notes, setNotes] = useState(initialValues.notes);
  const [selectedDate, setSelectedDate] = useState(initialValues.date);
  const [selectedTime, setSelectedTime] = useState(initialValues.time);
  const [selectedMechanicId, setSelectedMechanicId] = useState(initialValues.mechanicId);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cancelPending, startCancel] = useTransition();

  useEffect(() => {
    fetch(`/api/book/${slug}/slots?manageToken=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mechanics) setMechanics(data.mechanics);
      })
      .catch(() => {});
  }, [slug, token]);

  const loadSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({ date: selectedDate, manageToken: token });
      if (selectedMechanicId) params.set("mechanicId", selectedMechanicId);
      const res = await fetch(`/api/book/${slug}/slots?${params}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, token, selectedDate, selectedMechanicId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      date: selectedDate,
      time: selectedTime,
      mechanicId: selectedMechanicId,
      notes,
    };

    startTransition(async () => {
      const res = await fetch(`/api/book/${slug}/manage/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error?.time?.[0] ??
          (typeof data.error === "string" ? data.error : "No se pudo guardar el cambio");
        setError(msg);
        if (res.status === 409) loadSlots();
        return;
      }

      setStep("saved");
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm("¿Cancelar esta cita?")) return;
    setError(null);
    startCancel(async () => {
      const res = await fetch(`/api/book/${slug}/manage/${token}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo cancelar la cita");
        return;
      }

      setStep("cancelled");
      router.refresh();
    });
  }

  if (step === "saved") {
    return (
      <div className="text-center py-12 space-y-3">
        <CheckCircle2 className="w-16 h-16 text-teal-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">¡Cita actualizada!</h2>
        <p className="text-slate-600">Recibirás un correo con los nuevos detalles.</p>
      </div>
    );
  }

  if (step === "cancelled") {
    return (
      <div className="text-center py-12 space-y-3">
        <Ban className="w-16 h-16 text-amber-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Cita cancelada</h2>
        <p className="text-slate-600">
          {shop.phone ? (
            <>
              Si deseas reprogramar, llama al{" "}
              <a href={`tel:${shop.phone}`} className="text-teal-700 font-medium">
                {shop.phone}
              </a>
              .
            </>
          ) : (
            "Contáctanos si deseas reprogramar."
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Servicio solicitado *
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Fecha y hora</h3>

        {mechanics.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mecánico (opcional)
            </label>
            <select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className={inputClass}
            >
              <option value="">Cualquier disponible</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime("");
            }}
            className={inputClass}
          />
        </div>

        {loadingSlots ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando horarios...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTime && !slots.some((s) => s.time === selectedTime) && (
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-sm border bg-teal-600 text-white border-teal-600 min-w-[4.5rem]"
              >
                {selectedTime}
              </button>
            )}
            {slots.length === 0 && !selectedTime ? (
              <p className="text-sm text-slate-500">No hay horarios disponibles este día.</p>
            ) : (
              slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setSelectedTime(slot.time)}
                  className={[
                    "px-3 py-2 rounded-lg text-sm border transition-colors min-w-[4.5rem]",
                    selectedTime === slot.time
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-teal-300",
                  ].join(" ")}
                >
                  {slot.time}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={pending || cancelPending || !selectedDate || !selectedTime}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending || cancelPending}
          className="flex items-center justify-center gap-2 border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50 font-medium py-3 px-5 rounded-xl transition-colors"
        >
          {cancelPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          Cancelar cita
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";
