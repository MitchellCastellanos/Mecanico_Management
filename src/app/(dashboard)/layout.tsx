import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "sonner";

// Layout del dashboard con sidebar y topbar
// Protege todas las sub-rutas automáticamente
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (!session.user.shopId) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={session.user?.name} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
