/**
 * Marca y dominio del taller en producción.
 * Las variables de Vercel tienen prioridad; esto es fallback y documentación en código.
 */
export const BRAND = {
  domain: "garagecarlosainc.ca",
  appUrl: "https://garagecarlosainc.ca",
  shopId: "shop-carlos-mtl",
  shopName: "Garage Carlos A Inc.",
  /** Logo PNG sin fondo — favicon, homepage, emails de respaldo */
  logoPath: "/logo.png",
  bookingSlug: "garage-carlos-a",
  timezone: "America/Montreal",
  emails: {
    contact: "info@garagecarlosainc.ca",
    billing: "billing@garagecarlosainc.ca",
    info: "info@garagecarlosainc.ca",
    providers: "providers@garagecarlosainc.ca",
    newsletter: "newsletter@garagecarlosainc.ca",
  },
  mailFrom: {
    invoices: "Garage Carlos A <billing@garagecarlosainc.ca>",
    reminders: "Garage Carlos A <info@garagecarlosainc.ca>",
    accounting: "Garage Carlos A <billing@garagecarlosainc.ca>",
    web: "Garage Carlos A <info@garagecarlosainc.ca>",
    fallback: "Garage Carlos A <info@garagecarlosainc.ca>",
  },
  /** Hosts legacy que redirigen al dominio propio */
  legacyHosts: ["mecanico-management.vercel.app"],
} as const;

export function bookingPublicPath(slug = BRAND.bookingSlug): string {
  return `/book/${slug}`;
}

export function bookingPublicUrl(slug = BRAND.bookingSlug): string {
  return `${BRAND.appUrl}${bookingPublicPath(slug)}`;
}
