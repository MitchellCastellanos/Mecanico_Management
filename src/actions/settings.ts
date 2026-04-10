"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

async function getShopId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.shopId) redirect("/login");
  return session.user.shopId;
}

// ── READ ────────────────────────────────────────────────────

export async function getShopSettings() {
  const shopId = await getShopId();
  return db.shop.findUnique({ where: { id: shopId } });
}

// ── UPDATE SHOP INFO ─────────────────────────────────────────

const shopSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  address: z.string().max(255).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  taxId: z.string().max(100).optional().or(z.literal("")),
});

export async function updateShopSettings(formData: FormData) {
  const shopId = await getShopId();

  const raw = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    taxId: formData.get("taxId") as string,
  };

  const parsed = shopSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, address, phone, email, taxId } = parsed.data;

  await db.shop.update({
    where: { id: shopId },
    data: {
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      taxId: taxId || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

// ── UPLOAD LOGO ──────────────────────────────────────────────

export async function uploadShopLogo(formData: FormData) {
  const shopId = await getShopId();

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "No se seleccionó ningún archivo" };

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) return { error: "El logo no puede superar 5 MB" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Solo se aceptan JPG, PNG, WebP o SVG" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "png";
  const storagePath = `logos/${shopId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("accounting")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: `Error subiendo logo: ${uploadError.message}` };

  const { data } = supabase.storage.from("accounting").getPublicUrl(storagePath);
  const logoUrl = `${data.publicUrl}?t=${Date.now()}`; // cache-busting

  await db.shop.update({ where: { id: shopId }, data: { logoUrl } });
  revalidatePath("/settings");
  return { success: true, logoUrl };
}

// ── CHANGE PASSWORD ──────────────────────────────────────────

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const current = formData.get("currentPassword") as string;
  const next = formData.get("newPassword") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!current || !next || !confirm) return { error: "Todos los campos son requeridos" };
  if (next.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres" };
  if (next !== confirm) return { error: "Las contraseñas no coinciden" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { error: "Usuario no encontrado" };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { error: "La contraseña actual es incorrecta" };

  const hash = await bcrypt.hash(next, 12);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } });
  return { success: true };
}
