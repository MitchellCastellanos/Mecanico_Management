import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/booking-slots";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { Hero } from "@/components/booking/Hero";
import { ServicesSection } from "@/components/booking/ServicesSection";
import { OurShopSection } from "@/components/booking/OurShopSection";
import { BookingSection } from "@/components/booking/BookingSection";
import { SiteFooter } from "@/components/booking/SiteFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};

  return {
    title: `${shop.name} — Reserva tu cita en línea`,
    description: `Mécanique générale, baterías, neumáticos, frenos y cambio de aceite en ${shop.name}. Reserva tu cita en línea.`,
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || !shop.bookingEnabled) {
    notFound();
  }

  return (
    <div className="min-h-full">
      <SiteHeader shopName={shop.name} logoUrl={shop.logoUrl} phone={shop.phone} />
      <Hero
        shopName={shop.name}
        logoUrl={shop.logoUrl}
        address={shop.address}
        phone={shop.phone}
        tagline="Mecánica de confianza en Montréal — mecánica general, frenos, baterías y neumáticos, con cita en línea en minutos."
      />
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
    </div>
  );
}
