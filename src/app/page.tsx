import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Phone } from "lucide-react";
import { BRAND, bookingPublicPath, bookingPublicUrl } from "@/config/brand";
import { getShopBySlug } from "@/lib/booking-slots";

// Sin esto, Next intentaría pre-renderizar "/" en build time (horneando los
// datos del taller una sola vez) en vez de leerlos frescos en cada visita de
// un bot, como sí hace /book/[slug].
export const dynamic = "force-dynamic";

/**
 * Los visitantes reales nunca ven esta página: next.config.ts redirige "/" a
 * /book/[slug] para cualquier navegador. Esta ruta solo la sirve a los bots
 * de previsualización (WhatsApp, Facebook, X, etc. — ver `missing` en el
 * redirect) para que el link corto tenga metadatos ricos, y como respaldo si
 * el redirect no aplica (JS deshabilitado, UA desconocido).
 */
export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShopBySlug(BRAND.bookingSlug);
  const shopName = shop?.name ?? BRAND.shopName;
  const title = `${shopName} — Réservez votre rendez-vous en ligne`;
  const description = [
    `Mécanique générale, batteries, pneus, freins et vidange d'huile chez ${shopName}.`,
    shop?.address ? `${shop.address}.` : null,
    shop?.phone ? `Réservez en ligne ou appelez au ${shop.phone}.` : "Réservez votre rendez-vous en ligne.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    alternates: {
      canonical: BRAND.appUrl,
    },
    openGraph: {
      title,
      description,
      url: BRAND.appUrl,
      siteName: shopName,
      locale: "fr_CA",
      type: "website",
      images: [{ url: BRAND.ogImagePath, width: 1731, height: 909, alt: shopName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BRAND.ogImagePath],
    },
  };
}

export default async function RootPage() {
  const shop = await getShopBySlug(BRAND.bookingSlug);
  const shopName = shop?.name ?? BRAND.shopName;

  return (
    <main className="min-h-full flex items-center justify-center bg-brand-black text-center px-4 py-24">
      <div className="max-w-lg">
        <h1 className="font-sans font-black uppercase text-white text-4xl sm:text-5xl leading-[1.02] tracking-tight">
          {shopName}
        </h1>
        <p className="mt-4 text-slate-300">
          Mécanique générale, batteries, pneus, freins et vidange d&apos;huile à Montréal.
        </p>

        <Link
          href={bookingPublicPath()}
          className="mt-8 inline-flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-semibold uppercase tracking-wide text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-red-950/40 transition-colors"
        >
          Réservez en ligne
          <ChevronRight className="w-4 h-4" />
        </Link>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-brand-red" />
              {shop.phone}
            </a>
          )}
          {shop?.address && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-brand-red shrink-0" />
              {shop.address}
            </span>
          )}
        </div>

        <p className="mt-10 text-xs text-slate-500">
          <Link href={bookingPublicUrl()} className="hover:text-slate-300 transition-colors">
            {BRAND.domain}
          </Link>
        </p>
      </div>
    </main>
  );
}
