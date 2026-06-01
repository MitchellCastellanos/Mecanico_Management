import Image from "next/image";
import Link from "next/link";
import { BRAND, bookingPublicUrl } from "@/config/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={BRAND.logoPath}
            alt={BRAND.shopName}
            width={48}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
          <span className="font-semibold text-lg hidden sm:inline">{BRAND.shopName}</span>
        </Link>
        <Link
          href="/admin/login"
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          Acceso empleados
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <Image
          src={BRAND.logoPath}
          alt={BRAND.shopName}
          width={220}
          height={220}
          className="mx-auto h-32 sm:h-44 w-auto object-contain"
          priority
        />
        <h1 className="mt-8 text-4xl sm:text-5xl font-bold tracking-tight">{BRAND.shopName}</h1>
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
