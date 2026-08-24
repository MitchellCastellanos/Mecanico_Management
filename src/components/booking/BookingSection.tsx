"use client";

import { motion } from "framer-motion";
import { PublicBookingForm } from "@/components/booking/PublicBookingForm";

interface BookingSectionProps {
  slug: string;
  shop: {
    name: string;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    bookingSlotMinutes: number;
  };
}

export function BookingSection({ slug, shop }: BookingSectionProps) {
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
            Reserva en línea
          </span>
          <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl text-slate-900 mt-2">
            Agenda tu cita
          </h2>
          <p className="text-slate-500 mt-3">
            Elige el día, la hora y cuéntanos qué le pasa a tu auto.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8"
        >
          <PublicBookingForm slug={slug} shop={shop} />
        </motion.div>
      </div>
    </section>
  );
}
