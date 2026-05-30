/** URL pública de la app — logos en emails, links absolutos, etc. */
export function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Logo de respaldo cuando el taller no tiene logo propio. */
export function getDefaultEmailLogoUrl(): string {
  return `${getAppUrl()}/email/mecanico-logo.svg`;
}
