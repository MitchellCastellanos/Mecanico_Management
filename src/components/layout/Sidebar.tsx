"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Calendar,
  Bell,
  FolderOpen,
  Settings,
  Wrench,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Facturas",
    href: "/invoices",
    icon: FileText,
  },
  {
    label: "Cotizaciones",
    href: "/quotes",
    icon: FileSpreadsheet,
  },
  {
    label: "Citas",
    href: "/appointments",
    icon: Calendar,
  },
  {
    label: "Recordatorios",
    href: "/reminders",
    icon: Bell,
  },
  {
    label: "Contabilidad",
    href: "/accounting",
    icon: FolderOpen,
  },
  {
    label: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print w-64 min-h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">
              Mecanico
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — version */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-slate-500 text-xs">v1.0.0</p>
      </div>
    </aside>
  );
}
