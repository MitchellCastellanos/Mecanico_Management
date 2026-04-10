import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  FileText,
  DollarSign,
  Bell,
  TrendingUp,
  AlertCircle,
  Plus,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const shopId = session?.user?.shopId;

  if (!shopId) {
    return (
      <div className="text-center py-20 text-slate-500">
        Configurando tu taller...
      </div>
    );
  }

  const [clientCount, invoiceCount, pendingReminders, recentInvoices] =
    await Promise.all([
      db.client.count({ where: { shopId } }),
      db.invoice.count({ where: { shopId } }),
      db.serviceReminder.count({ where: { shopId, status: "PENDING" } }),
      db.invoice.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { client: true },
      }),
    ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = await db.invoice.aggregate({
    where: {
      shopId,
      status: "PAID",
      paidAt: { gte: startOfMonth },
    },
    _sum: { total: true },
  });

  const metrics = [
    {
      label: "Clientes registrados",
      value: clientCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Facturas totales",
      value: invoiceCount,
      icon: FileText,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Ingresos este mes",
      value: formatCurrency(Number(monthlyRevenue._sum.total ?? 0)),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Recordatorios pendientes",
      value: pendingReminders,
      icon: Bell,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Bienvenido, {session?.user?.name}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <div
                  className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Facturas recientes + acción rápida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Facturas recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">
                Facturas recientes
              </h2>
            </div>
            <Link
              href="/invoices"
              className="text-xs text-blue-600 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No hay facturas todavía</p>
              <Link
                href="/invoices/new"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Crear primera factura →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {invoice.client.firstName} {invoice.client.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(Number(invoice.total))}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">
            Acciones rápidas
          </h2>
          <div className="space-y-2">
            <Link
              href="/clients/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-slate-700">Nuevo cliente</span>
            </Link>
            <Link
              href="/invoices/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <span className="font-medium text-slate-700">Nueva factura</span>
            </Link>
            <Link
              href="/reminders/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-slate-700">
                Nuevo recordatorio
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Alerta recordatorios pendientes */}
      {pendingReminders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {pendingReminders} recordatorio
              {pendingReminders !== 1 ? "s" : ""} pendiente
              {pendingReminders !== 1 ? "s" : ""}
            </p>
            <Link
              href="/reminders"
              className="text-xs text-amber-700 hover:underline"
            >
              Ver recordatorios →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    SENT: "bg-blue-100 text-blue-700",
    PAID: "bg-emerald-100 text-emerald-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-400",
  };
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    SENT: "Enviada",
    PAID: "Pagada",
    OVERDUE: "Vencida",
    CANCELLED: "Cancelada",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] ?? styles.DRAFT
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
