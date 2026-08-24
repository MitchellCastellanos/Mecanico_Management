"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { PublicBookingForm } from "@/components/booking/PublicBookingForm";
import { useSiteLocale } from "@/components/booking/LocaleProvider";

interface BookingSectionProps {
  slug: string;
  bookingEnabled: boolean;
  shop: {
    name: string;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    bookingSlotMinutes: number;
  };
}

export function BookingSection({ slug, bookingEnabled, shop }: BookingSectionProps) {
  const { t } = useSiteLocale();

  return (
    <section id="cita" className="bg-slate-50 py-20 sm:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="text-brand-red font-semibold text-sm uppercase tracking-widest">
            {t.booking.eyebrow}
          </span>
          <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl text-slate-900 mt-2">
            {t.booking.heading}
          </h2>
          <p className="text-slate-500 mt-3">{t.booking.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8"
        >
          {bookingEnabled ? (
            <PublicBookingForm slug={slug} shop={shop} />
          ) : (
            <div className="text-center py-8 space-y-4">
              <h3 className="text-xl font-bold text-slate-900">{t.booking.unavailableTitle}</h3>
              <p className="text-slate-500 max-w-sm mx-auto">{t.booking.unavailableBody}</p>
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-medium px-5 py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {t.booking.callInstead} · {shop.phone}
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
