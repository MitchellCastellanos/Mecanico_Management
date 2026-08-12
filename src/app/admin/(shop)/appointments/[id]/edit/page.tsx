import { ADMIN } from "@/lib/routes";
import { redirect } from "next/navigation";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import {
  appointmentToFormValues,
  getAppointmentById,
  getAppointmentFormData,
  updateAppointment,
} from "@/actions/appointments";
import { type AppointmentFormData } from "@/lib/validations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAppointmentPage({ params }: Props) {
  const { id } = await params;
  const [appointment, { clients, mechanics }] = await Promise.all([
    getAppointmentById(id),
    getAppointmentFormData(),
  ]);

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    redirect(ADMIN.appointments);
  }

  const { date, time } = await appointmentToFormValues(
    appointment.startsAt,
    appointment.shop.timezone
  );

  const initialValues: Partial<AppointmentFormData> = {
    clientId: appointment.clientId,
    vehicleId: appointment.vehicleId ?? "",
    mechanicId: appointment.mechanicId ?? "",
    title: appointment.title,
    date,
    time,
    durationMinutes: appointment.durationMinutes,
    notes: appointment.notes ?? "",
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar cita</h1>
        <p className="text-slate-500 text-sm mt-1">
          Si el cliente tiene teléfono o email, se le avisa automáticamente del cambio.
        </p>
      </div>

      <AppointmentForm
        mode="edit"
        clients={clients}
        mechanics={mechanics}
        initialValues={initialValues}
        onSubmit={async (data: AppointmentFormData) => {
          "use server";
          return updateAppointment(id, data);
        }}
      />
    </div>
  );
}
