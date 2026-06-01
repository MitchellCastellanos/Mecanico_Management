import { ADMIN } from "@/lib/routes";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getAppointments } from "@/actions/appointments";
import { AppointmentList } from "@/components/appointments/AppointmentList";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

function shiftWeek(weekStart: string, delta: number) {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short" });
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { week } = await searchParams;
  const { appointments, weekStart } = await getAppointments(week);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
          <p className="text-slate-500 text-sm mt-1">
            {appointments.length} cita{appointments.length !== 1 ? "s" : ""} esta semana
          </p>
        </div>
        <Link
          href={`${ADMIN.appointments}/new`}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </Link>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
        <Link
          href={`/appointments?week=${shiftWeek(weekStart, -1)}`}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Semana anterior
        </Link>
        <span className="text-sm font-semibold text-slate-900 capitalize">
          {formatWeekLabel(weekStart)}
        </span>
        <Link
          href={`/appointments?week=${shiftWeek(weekStart, 1)}`}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          Semana siguiente
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <AppointmentList appointments={appointments} weekStart={weekStart} />
    </div>
  );
}
