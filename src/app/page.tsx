import { redirect } from "next/navigation";

// Redirige a /dashboard (dentro del route group (dashboard))
// El middleware maneja la autenticación antes de llegar aquí
export default function RootPage() {
  redirect("/dashboard");
}
