"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSiteLocale } from "@/components/booking/LocaleProvider";
import { OTHER_VALUE, VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from "@/lib/vehicle-catalog";
import { MonthCalendar } from "@/components/booking/MonthCalendar";

interface ShopInfo {
  name: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  bookingSlotMinutes: number;
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
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [makeOther, setMakeOther] = useState("");
  const [model, setModel] = useState("");
  const [modelOther, setModelOther] = useState("");
  const [serviceValue, setServiceValue] = useState("");
  const [serviceOther, setServiceOther] = useState("");

  const resolvedMake = make === OTHER_VALUE ? makeOther.trim() : make;
  const resolvedModel =
    make === OTHER_VALUE || model === OTHER_VALUE ? modelOther.trim() : model;
  const resolvedTitle =
    serviceValue === OTHER_VALUE
      ? serviceOther.trim()
      : (t.form.serviceOptions.find((o) => o.value === serviceValue)?.label ?? "");

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
          setAvailableDates(new Set(data.availableDates ?? data.dates));
        }
      })
      .catch(() => setError(t.form.couldNotLoadAvailability));
  }, [slug, t.form.couldNotLoadAvailability]);

  const loadSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const res = await fetch(`/api/book/${slug}/slots?date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, selectedDate]);

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
      year,
      licensePlate: formData.get("licensePlate"),
      title: resolvedTitle,
      date: selectedDate,
      time: selectedTime,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className={stepHeadingClass}>1. {t.form.stepPickDay}</h3>
        <MonthCalendar
          dates={dates}
          availableDates={availableDates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          intlLocale={t.intlLocale}
          prevMonthLabel={t.form.previousMonth}
          nextMonthLabel={t.form.nextMonth}
        />
      </div>

      {selectedDate && (
        <div className="border-t border-slate-100 pt-6">
          <h3 className={stepHeadingClass}>2. {t.form.stepPickTime}</h3>
          <p className="text-sm font-medium text-slate-700 mb-3 text-center capitalize">
            {formatDateLabel(selectedDate, t.intlLocale)}
          </p>
          {loadingSlots ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.form.loadingAvailability}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500 text-center">{t.form.noSlots}</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
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
      )}

      {selectedTime && (
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className={stepHeadingClass}>3. {t.form.stepVehicle}</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.year}</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className={inputClass}
            >
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

          {year && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.make}
              </label>
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
          )}

          {make && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.model}
              </label>
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
          )}
        </div>
      )}

      {resolvedModel && (
        <div className="border-t border-slate-100 pt-6">
          <h3 className={stepHeadingClass}>4. {t.form.serviceRequested}</h3>
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
      )}

      {resolvedTitle && (
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className={stepHeadingClass}>5. {t.form.stepYourInfo}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.fullName}
              </label>
              <input name="fullName" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.phone}
              </label>
              <input name="phone" type="tel" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.emailOptional}
              </label>
              <input name="email" type="email" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.form.licensePlate}
              </label>
              <input name="licensePlate" className={inputClass} />
            </div>
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
        </div>
      )}
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

const stepHeadingClass = "font-display font-bold uppercase text-sm tracking-wide text-slate-900 mb-4";
