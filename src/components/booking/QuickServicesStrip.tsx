"use client";

import { motion } from "framer-motion";
import { BatteryCharging, CircleDashed, Disc3, Droplet, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Wrench, label: "Mecánica general" },
  { icon: Disc3, label: "Frenos" },
  { icon: CircleDashed, label: "Neumáticos" },
  { icon: BatteryCharging, label: "Baterías" },
  { icon: Droplet, label: "Cambio de aceite" },
];

export function QuickServicesStrip() {
  return (
    <div className="relative z-10 -mt-8 sm:-mt-10 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl shadow-black/10 border border-slate-100 px-3 sm:px-6 py-4 flex items-center gap-2 sm:gap-4 overflow-x-auto"
      >
        {ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() =>
              document.querySelector("#servicios")?.scrollIntoView({ behavior: "smooth" })
            }
            className="group flex items-center gap-2.5 shrink-0 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            <span className="w-9 h-9 rounded-lg bg-brand-red/10 flex items-center justify-center group-hover:bg-brand-red transition-colors shrink-0">
              <item.icon className="w-[18px] h-[18px] text-brand-red group-hover:text-white transition-colors" />
            </span>
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
