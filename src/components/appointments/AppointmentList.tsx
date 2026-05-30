"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelAppointment,
  sendAppointmentConfirmation,
} from "@/actions/appointments";
import { formatClientName } from "@/lib/client-name";
import { Calendar, Clock, Loader2, Mail, User, Ban } from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  startsAt: Date | string;
  endsAt: Date | string;
  durationMinutes: number;
  status: string;
  client: { firstName: string; lastName?: string | null; email?: string | null };
  vehicle?: { year: number; make: string; model: string; licensePlate: string } | null;
  mechanic?: { name: string } | null;
}

interface AppointmentListProps {
  appointments: Appointment[];
  weekStart: string;
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-600",
  CONFIRMED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-400",
  NO_SHOW: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDayHeader(date: Date | string) {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

function groupByDay(appointments: Appointment[]) {
  const groups = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    const key = new Date(apt.startsAt).toISOString().split("T")[0];
    const list = groups.get(key) ?? [];
    list.push(apt);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [confirmPending, startConfirm] = useTransition();
  const [cancelPending, startCancel] = useTransition();

  const canConfirm =
    (appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") &&
    Boolean(appointment.client.email?.trim());
  const canCancel = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3 min-w-[100px]">
        <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-900">
          {formatTime(appointment.startsAt)}
        </span>
        <span className="text-xs text-slate-400">{appointment.durationMinutes} min</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm">{appointment.title}</p>
        <p className="text-sm text-slate-600">{formatClientName(appointment.client)}</p>
        {appointment.vehicle && (
          <p className="text-xs text-slate-400">
            {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
          </p>
        )}
        {appointment.mechanic && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3" />
            {appointment.mechanic.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[appointment.status] ?? "bg-slate-100 text-slate-500"}`}
        >
          {STATUS_LABEL[appointment.status] ?? appointment.status}
        </span>

        {canConfirm && appointment.status === "SCHEDULED" && (
          <button
            type="button"
            disabled={confirmPending || cancelPending}
            onClick={() =>
              startConfirm(async () => {
                const result = await sendAppointmentConfirmation(appointment.id);
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`Confirmación enviada a ${result.sentTo}`);
                router.refresh();
              })
            }
            className="flex items-center gap-1 px-2.5 py-1.5 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {confirmPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Mail className="w-3 h-3" />
            )}
            Confirmar
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            disabled={confirmPending || cancelPending}
            onClick={() => {
              if (!confirm("¿Cancelar esta cita?")) return;
              startCancel(async () => {
                const result = await cancelAppointment(appointment.id);
                if (result?.error) {
                  toast.error(result.error);
                  return;
                }
                toast.info("Cita cancelada");
                router.refresh();
              });
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-amber-200 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {cancelPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Ban className="w-3 h-3" />
            )}
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function AppointmentList({ appointments, weekStart }: AppointmentListProps) {
  const groups = groupByDay(appointments);

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No hay citas esta semana</p>
        <p className="text-slate-400 text-sm mt-1">
          Semana del {formatDayHeader(weekStart)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([day, dayAppointments]) => (
        <div key={day} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 capitalize">
              {formatDayHeader(day)}
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {dayAppointments.map((apt) => (
              <AppointmentRow key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
