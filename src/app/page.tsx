import Link from "next/link";
import { BRAND, bookingPublicUrl } from "@/config/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <p className="font-semibold text-lg">{BRAND.shopName}</p>
        <Link
          href="/admin/login"
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          Acceso empleados
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{BRAND.shopName}</h1>
        <p className="mt-4 text-lg text-slate-300">
          Taller mecánico en Montréal — sitio web en construcción.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={bookingPublicUrl()}
            className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Reservar una cita
          </Link>
          <a
            href={`mailto:${BRAND.emails.info}`}
            className="inline-flex items-center justify-center border border-slate-600 hover:border-slate-400 text-slate-200 font-medium px-6 py-3 rounded-xl transition-colors"
          >
            {BRAND.emails.info}
          </a>
        </div>
      </main>
    </div>
  );
}
