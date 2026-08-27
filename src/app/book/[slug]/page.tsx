import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/booking-slots";
import { BRAND, bookingPublicUrl } from "@/config/brand";
import { LocaleProvider } from "@/components/booking/LocaleProvider";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { Hero } from "@/components/booking/Hero";
import { QuickServicesStrip } from "@/components/booking/QuickServicesStrip";
import { ServicesSection } from "@/components/booking/ServicesSection";
import { OurShopSection } from "@/components/booking/OurShopSection";
import { BookingSection } from "@/components/booking/BookingSection";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { WhatsAppButton } from "@/components/booking/WhatsAppButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};

  const title = `${shop.name} — Réservez votre rendez-vous en ligne`;
  const description = [
    `Mécanique générale, batteries, pneus, freins et vidange d'huile chez ${shop.name}.`,
    shop.address ? `${shop.address}.` : null,
    shop.phone ? `Réservez en ligne ou appelez au ${shop.phone}.` : "Réservez votre rendez-vous en ligne.",
  ]
    .filter(Boolean)
    .join(" ");
  const url = bookingPublicUrl(slug);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: shop.name,
      locale: "fr_CA",
      type: "website",
      images: [{ url: BRAND.ogImagePath, width: 1731, height: 909, alt: shop.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BRAND.ogImagePath],
    },
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) {
    notFound();
  }

  return (
    <LocaleProvider>
      <div className="min-h-full">
        <SiteHeader shopName={shop.name} logoUrl={shop.logoUrl} phone={shop.phone} />
        <Hero shopName={shop.name} address={shop.address} phone={shop.phone} />
        <QuickServicesStrip />
        <ServicesSection />
        <OurShopSection shopName={shop.name} address={shop.address} phone={shop.phone} />
        <BookingSection
          slug={slug}
          shop={{
            name: shop.name,
            phone: shop.phone,
            address: shop.address,
            logoUrl: shop.logoUrl,
            bookingSlotMinutes: shop.bookingSlotMinutes,
          }}
        />
        <SiteFooter
          shopName={shop.name}
          logoUrl={shop.logoUrl}
          address={shop.address}
          phone={shop.phone}
        />
        <WhatsAppButton phone={shop.phone} />
      </div>
    </LocaleProvider>
  );
}
