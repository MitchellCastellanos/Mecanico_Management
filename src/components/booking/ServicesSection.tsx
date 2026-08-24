"use client";

import { motion } from "framer-motion";
import { BatteryCharging, CircleDashed, Disc3, Droplet, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SERVICES: Service[] = [
  {
    icon: Wrench,
    title: "Mécanique générale",
    description: "Diagnóstico, mantenimiento y reparación completa para todas las marcas.",
  },
  {
    icon: BatteryCharging,
    title: "Baterías",
    description: "Revisión del sistema eléctrico e instalación de baterías nuevas.",
  },
  {
    icon: CircleDashed,
    title: "Neumáticos",
    description: "Cambio de llantas, balanceo y alineación para rodar seguro.",
  },
  {
    icon: Disc3,
    title: "Frenos",
    description: "Inspección, pastillas, discos y ajuste del sistema de frenado.",
  },
  {
    icon: Droplet,
    title: "Cambio de aceite",
    description: "Cambio de aceite y filtro con productos de calidad.",
  },
];

export function ServicesSection() {
  return (
    <section id="servicios" className="bg-slate-50 py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-12"
        >
          <span className="text-brand-red font-semibold text-sm uppercase tracking-widest">
            Qué hacemos
          </span>
          <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl text-slate-900 mt-2">
            Servicios del taller
          </h2>
          <p className="text-slate-500 mt-3">
            Todo lo que tu auto necesita, en un mismo lugar y con cita en línea.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:border-brand-red/30 transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4 group-hover:bg-brand-red transition-colors">
                <service.icon className="w-6 h-6 text-brand-red group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-display font-semibold uppercase tracking-wide text-slate-900">
                {service.title}
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: SERVICES.length * 0.07 }}
            className="rounded-2xl bg-brand-black text-white p-6 flex flex-col justify-center"
          >
            <p className="font-display font-bold uppercase text-lg leading-snug">
              ¿No ves tu servicio?
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Escríbelo al reservar tu cita y lo revisamos juntos.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
