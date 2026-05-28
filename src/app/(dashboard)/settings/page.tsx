import { getShopSettings } from "@/actions/settings";
import { getTeamMembers } from "@/actions/users";
import { ShopSettingsForm } from "@/components/settings/ShopSettingsForm";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { SupportCard } from "@/components/settings/SupportCard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const shop = await getShopSettings();
  if (!shop) redirect("/dashboard");

  const isOwner = session.user.role === "OWNER";
  const team = isOwner ? await getTeamMembers() : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">
          Logo, datos del taller, contraseña y administración del equipo
        </p>
      </div>

      <ShopSettingsForm shop={shop} />

      {isOwner && (
        <TeamManagement members={team} currentUserId={session.user.id} />
      )}

      <SupportCard />
    </div>
  );
}
