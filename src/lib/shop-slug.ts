/** Genera un slug URL-safe a partir del nombre del taller. */
export function slugifyShopName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidShopSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/.test(slug);
}

import { getAppUrl } from "@/lib/app-url";
import { BRAND } from "@/config/brand";

export function getPublicBookingUrl(slug: string = BRAND.bookingSlug): string {
  return `${getAppUrl()}/book/${slug}`;
}
