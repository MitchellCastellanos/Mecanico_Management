import { getShopSettings } from "@/actions/settings";
import { ShopSettingsForm } from "@/components/settings/ShopSettingsForm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const shop = await getShopSettings();
  if (!shop) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">
          Logo, datos del taller y números de impuestos
        </p>
      </div>

      <ShopSettingsForm shop={shop} />
    </div>
  );
}
