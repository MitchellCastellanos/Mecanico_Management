/** URL pública de la app — logos en emails, links absolutos, etc. */
import { BRAND } from "@/config/brand";

export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? BRAND.appUrl : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

/** Logo de respaldo cuando el taller no tiene logo propio. */
export function getDefaultEmailLogoUrl(): string {
  return `${getAppUrl()}/email/mecanico-logo.svg`;
}
