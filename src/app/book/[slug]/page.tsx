import { notFound } from "next/navigation";
import Image from "next/image";
import { getShopBySlug } from "@/lib/booking-slots";
import { PublicBookingForm } from "@/components/booking/PublicBookingForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || !shop.bookingEnabled) {
    notFound();
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        <header className="text-center mb-8">
          {shop.logoUrl && (
            <div className="flex justify-center mb-4">
              <Image
                src={shop.logoUrl}
                alt={shop.name}
                width={80}
                height={80}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          <p className="text-slate-500 mt-1">Reserva tu cita en línea</p>
          {shop.address && <p className="text-sm text-slate-400 mt-2">{shop.address}</p>}
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="text-sm text-teal-700 mt-1 inline-block">
              {shop.phone}
            </a>
          )}
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <PublicBookingForm
            slug={slug}
            shop={{
              name: shop.name,
              phone: shop.phone,
              address: shop.address,
              logoUrl: shop.logoUrl,
              bookingSlotMinutes: shop.bookingSlotMinutes,
            }}
          />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Mecanico Management
        </p>
      </div>
    </div>
  );
}
