import { notFound } from "next/navigation";
import Image from "next/image";
import { getShopAndAppointmentByToken, isAppointmentEditable } from "@/lib/appointment-manage";
import { ManageAppointmentForm } from "@/components/booking/ManageAppointmentForm";
import { formatClientName } from "@/lib/client-name";
import { formatShopDate, formatShopDateTime, formatShopTime } from "@/lib/shop-timezone";
import { BRAND } from "@/config/brand";

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export default async function ManageAppointmentPage({ params }: PageProps) {
  const { slug, token } = await params;
  const found = await getShopAndAppointmentByToken(slug, token);

  if (!found) notFound();

  const { shop, appointment } = found;
  const editable = isAppointmentEditable(appointment);

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
          <p className="text-slate-500 mt-1">
            {editable ? "Edita tu cita" : "Detalles de tu cita"}
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {editable ? (
            <ManageAppointmentForm
              slug={slug}
              token={token}
              shop={{
                phone: shop.phone,
                bookingSlotMinutes: shop.bookingSlotMinutes,
              }}
              initialValues={{
                title: appointment.title,
                date: formatShopDate(appointment.startsAt, shop.timezone),
                time: formatShopTime(appointment.startsAt, shop.timezone),
                mechanicId: appointment.mechanicId ?? "",
                notes: appointment.notes ?? "",
              }}
            />
          ) : (
            <div className="space-y-4 text-center py-6">
              <p className="text-slate-700">
                Hola {formatClientName(appointment.client)}, esta cita ya no se puede editar en
                línea.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-left space-y-1">
                <p className="font-medium text-slate-900">{appointment.title}</p>
                <p className="text-slate-600">
                  {formatShopDateTime(appointment.startsAt, shop.timezone)}
                </p>
                <p className="text-slate-500">
                  Estado: {STATUS_LABEL[appointment.status] ?? appointment.status}
                </p>
              </div>
              {shop.phone && (
                <p className="text-sm text-slate-500">
                  Para cambios, llama al{" "}
                  <a href={`tel:${shop.phone}`} className="text-teal-700 font-medium">
                    {shop.phone}
                  </a>
                  .
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          {BRAND.shopName} · {BRAND.domain}
        </p>
      </div>
    </div>
  );
}
