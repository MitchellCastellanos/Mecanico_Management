import { getAppUrl } from "@/lib/app-url";
import { BRAND } from "@/config/brand";

export function getPublicBookingUrl(slug: string = BRAND.bookingSlug): string {
  return `${getAppUrl()}/book/${slug}`;
}
