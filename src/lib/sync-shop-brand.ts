import { db } from "@/lib/db";
import { BRAND } from "@/config/brand";

/**
 * Rellena buzones/slug del taller en producción si aún están vacíos.
 * No sobrescribe datos que el dueño ya guardó en Configuración.
 */
export async function syncShopBrandDefaults() {
  const shop = await db.shop.findUnique({ where: { id: BRAND.shopId } });
  if (!shop) return { updated: false, reason: "shop_not_found" as const };

  const data: Record<string, string | boolean> = {};

  if (!shop.billingEmail?.trim()) data.billingEmail = BRAND.emails.billing;
  if (!shop.infoEmail?.trim()) data.infoEmail = BRAND.emails.info;
  if (!shop.providersEmail?.trim()) data.providersEmail = BRAND.emails.providers;
  if (!shop.newsletterEmail?.trim()) data.newsletterEmail = BRAND.emails.newsletter;
  if (!shop.email?.trim()) data.email = BRAND.emails.contact;
  if (!shop.slug?.trim()) data.slug = BRAND.bookingSlug;

  if (Object.keys(data).length === 0) {
    return { updated: false, reason: "already_configured" as const };
  }

  await db.shop.update({ where: { id: BRAND.shopId }, data });
  return { updated: true, fields: Object.keys(data) };
}
