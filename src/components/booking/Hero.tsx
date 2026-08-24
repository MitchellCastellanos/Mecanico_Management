"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Phone } from "lucide-react";

interface HeroProps {
  shopName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  tagline: string;
}

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Hero({ shopName, logoUrl, address, phone, tagline }: HeroProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-brand-black garage-diagonal-stripes"
    >
      {/* Franja roja diagonal, como una puerta de garage */}
      <div className="pointer-events-none absolute -right-32 top-0 h-full w-[45%] -skew-x-12 bg-gradient-to-b from-brand-red via-brand-red-dark to-brand-black opacity-90" />
      <div className="pointer-events-none absolute inset-0 garage-grid-texture opacity-40" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-block bg-brand-red/15 border border-brand-red/40 text-red-300 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
              Mécanique générale · Montréal
            </span>
            <h1 className="font-display font-bold uppercase text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              {shopName}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-xl">{tagline}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo("#cita")}
                className="inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-semibold uppercase tracking-wide px-6 py-3.5 rounded-xl shadow-lg shadow-red-950/40 transition-colors"
              >
                Reservar cita en línea
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium border border-white/20 hover:border-white/40 px-5 py-3.5 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4 text-brand-red" />
                  {phone}
                </a>
              )}
            </div>

            {address && (
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                {address}
              </p>
            )}
          </motion.div>

          {logoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              className="justify-self-center"
            >
              <div className="garage-float relative">
                <div className="absolute inset-0 rounded-full bg-brand-red/25 blur-3xl scale-90" />
                <Image
                  src={logoUrl}
                  alt={shopName}
                  width={280}
                  height={280}
                  priority
                  className="relative object-contain drop-shadow-2xl w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72"
                  unoptimized
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Borde inferior tipo "línea de meta" */}
      <div className="relative h-2 bg-[repeating-linear-gradient(90deg,#fff_0,#fff_16px,#131417_16px,#131417_32px)]" />
    </section>
  );
}
