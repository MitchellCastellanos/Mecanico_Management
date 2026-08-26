"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSiteLocale } from "@/components/booking/LocaleProvider";
import { OTHER_VALUE, VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from "@/lib/vehicle-catalog";

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
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [serviceValue, setServiceValue] = useState("");
  const [serviceOther, setServiceOther] = useState("");
  const [make, setMake] = useState("");
  const [makeOther, setMakeOther] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");

  const resolvedTitle =
    serviceValue === OTHER_VALUE
      ? serviceOther.trim()
      : (t.form.serviceOptions.find((o) => o.value === serviceValue)?.label ?? "");
  const resolvedMake = make === OTHER_VALUE ? makeOther.trim() : make;
  const resolvedModel =
    make === OTHER_VALUE || model === OTHER_VALUE ? modelOther.trim() : model;

  function handleMakeChange(value: string) {
    setMake(value);
    setModel("");
    setModelOther("");
  }

  useEffect(() => {
    fetch(`/api/book/${slug}/slots`)
      .then((r) => r.json())
      .then((data) => {
        if (data.dates) {
          setDates(data.dates);
          const available: string[] = data.availableDates ?? data.dates;
          setAvailableDates(new Set(available));
          setSelectedDate(available[0] ?? data.dates[0] ?? "");
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

    const fullName = String(formData.get("fullName") ?? "").trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ");

    const payload = {
      firstName,
      lastName,
      email: formData.get("email"),
      phone: formData.get("phone"),
      language: NOTIFICATION_LANGUAGE_FOR_SITE_LOCALE[locale],
      make: resolvedMake,
      model: resolvedModel,
      year: formData.get("year"),
      licensePlate: formData.get("licensePlate"),
      title: resolvedTitle,
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.fullName}
          </label>
          <input name="fullName" required className={inputClass} />
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
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.form.serviceRequested}
        </label>
        <select
          value={serviceValue}
          onChange={(e) => setServiceValue(e.target.value)}
          required
          className={inputClass}
        >
          <option value="" disabled>
            {t.form.selectPlaceholder}
          </option>
          {t.form.serviceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {serviceValue === OTHER_VALUE && (
          <input
            value={serviceOther}
            onChange={(e) => setServiceOther(e.target.value)}
            placeholder={t.form.specify}
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.make}</label>
          <select
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t.form.selectPlaceholder}
            </option>
            {VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={OTHER_VALUE}>{t.form.otherOption}</option>
          </select>
          {make === OTHER_VALUE && (
            <input
              value={makeOther}
              onChange={(e) => setMakeOther(e.target.value)}
              placeholder={t.form.specify}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.model}</label>
          {make === OTHER_VALUE ? (
            <input
              value={modelOther}
              onChange={(e) => setModelOther(e.target.value)}
              placeholder={t.form.specify}
              className={inputClass}
            />
          ) : (
            <>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                disabled={!make}
                className={inputClass}
              >
                <option value="" disabled>
                  {t.form.selectPlaceholder}
                </option>
                {(VEHICLE_MODELS[make] ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value={OTHER_VALUE}>{t.form.otherOption}</option>
              </select>
              {model === OTHER_VALUE && (
                <input
                  value={modelOther}
                  onChange={(e) => setModelOther(e.target.value)}
                  placeholder={t.form.specify}
                  className={`${inputClass} mt-2`}
                />
              )}
            </>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.year}</label>
          <select name="year" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              {t.form.selectPlaceholder}
            </option>
            {VEHICLE_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.form.licensePlate}
          </label>
          <input name="licensePlate" className={inputClass} />
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
          {dates.map((d) => {
            const isAvailable = availableDates.has(d);
            return (
              <button
                key={d}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setSelectedDate(d)}
                className={[
                  "px-3 py-2 rounded-lg text-sm border transition-colors",
                  !isAvailable
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    : selectedDate === d
                      ? "bg-brand-red text-white border-brand-red"
                      : "bg-white text-slate-700 border-slate-200 hover:border-red-300",
                ].join(" ")}
              >
                {formatDateLabel(d, t.intlLocale)}
              </button>
            );
          })}
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
        disabled={
          pending || !selectedDate || !selectedTime || !resolvedTitle || !resolvedMake || !resolvedModel
        }
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
