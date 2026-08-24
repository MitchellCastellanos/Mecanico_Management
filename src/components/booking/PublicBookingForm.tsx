"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { INVOICE_LANGUAGES } from "@/lib/invoice-i18n";
import { useSiteLocale } from "@/components/booking/LocaleProvider";

interface ShopInfo {
  name: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
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

interface PublicBookingFormProps {
  slug: string;
  shop: ShopInfo;
}

const NOTIFICATION_LANGUAGE_FOR_SITE_LOCALE = { fr: "FR", en: "EN", es: "ES" } as const;

export function PublicBookingForm({ slug, shop }: PublicBookingFormProps) {
  const { locale, t } = useSiteLocale();
  const [step, setStep] = useState<"form" | "done">("form");
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/book/${slug}/slots`)
      .then((r) => r.json())
      .then((data) => {
        if (data.dates) {
          setDates(data.dates);
          if (data.dates[0]) setSelectedDate(data.dates[0]);
        }
        if (data.mechanics) setMechanics(data.mechanics);
      })
      .catch(() => setError(t.form.couldNotLoadAvailability));
  }, [slug, t.form.couldNotLoadAvailability]);

  const loadSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedMechanicId) params.set("mechanicId", selectedMechanicId);
      const res = await fetch(`/api/book/${slug}/slots?${params}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, selectedDate, selectedMechanicId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      language: formData.get("language"),
      make: formData.get("make"),
      model: formData.get("model"),
      year: formData.get("year"),
      licensePlate: formData.get("licensePlate"),
      title: formData.get("title"),
      date: selectedDate,
      time: selectedTime,
      mechanicId: selectedMechanicId,
      notes: formData.get("notes"),
    };

    startTransition(async () => {
      const res = await fetch(`/api/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error?.time?.[0] ??
          data.error?.phone?.[0] ??
          data.error?.email?.[0] ??
          (typeof data.error === "string" ? data.error : t.form.couldNotBook);
        setError(msg);
        if (res.status === 409) loadSlots();
        return;
      }

      setManageUrl(data.manageUrl ?? null);
      setStep("done");
    });
  }

  if (step === "done") {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-brand-red mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">{t.form.doneTitle}</h2>
        <p className="text-slate-600">
          {t.form.smsNotice}
          {shop.phone && (
            <>
              {" "}
              {t.form.callForChanges}{" "}
              <a href={`tel:${shop.phone}`} className="text-brand-red-dark font-medium">
                {shop.phone}
              </a>
              .
            </>
          )}
        </p>
        {manageUrl && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-left">
            <p className="text-slate-700 mb-1">{t.form.saveLink}</p>
            <a
              href={manageUrl}
              className="text-brand-red-dark font-medium break-all underline underline-offset-2"
            >
              {manageUrl}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.firstName}
          </label>
          <input name="firstName" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.lastName}
          </label>
          <input name="lastName" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.phone}</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.emailOptional}
          </label>
          <input name="email" type="email" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Idioma / Language / Langue
          </label>
          <select
            key={locale}
            name="language"
            defaultValue={NOTIFICATION_LANGUAGE_FOR_SITE_LOCALE[locale]}
            className={inputClass}
          >
            {INVOICE_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.form.serviceRequested}
        </label>
        <input
          name="title"
          required
          placeholder={t.form.serviceRequestedPlaceholder}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.make}</label>
          <input name="make" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.model}</label>
          <input name="model" required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.year}</label>
          <input
            name="year"
            type="number"
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.licensePlate}
          </label>
          <input name="licensePlate" required className={inputClass} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6 space-y-4">
        <h3 className="font-semibold text-slate-900">{t.form.chooseDateTime}</h3>

        {mechanics.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.form.mechanicOptional}
            </label>
            <select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t.form.anyAvailable}</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={[
                "px-3 py-2 rounded-lg text-sm border transition-colors",
                selectedDate === d
                  ? "bg-brand-red text-white border-brand-red"
                  : "bg-white text-slate-700 border-slate-200 hover:border-red-300",
              ].join(" ")}
            >
              {formatDateLabel(d, t.intlLocale)}
            </button>
          ))}
        </div>

        {loadingSlots ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.form.loadingAvailability}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-500">{t.form.noSlots}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedTime(slot.time)}
                className={[
                  "px-3 py-2 rounded-lg text-sm border transition-colors min-w-[4.5rem]",
                  selectedTime === slot.time
                    ? "bg-brand-red text-white border-brand-red"
                    : "bg-white text-slate-700 border-slate-200 hover:border-red-300",
                ].join(" ")}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.form.notesOptional}
        </label>
        <textarea name="notes" rows={2} className={inputClass} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !selectedDate || !selectedTime}
        className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t.form.confirmAppointment(shop.bookingSlotMinutes)}
      </button>
    </form>
  );
}

function formatDateLabel(isoDate: string, intlLocale: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent";
