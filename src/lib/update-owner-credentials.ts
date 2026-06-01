import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { BRAND } from "@/config/brand";

const NEW_OWNER_EMAIL = "info@garagecarlosainc.ca";

/** Actualiza email/contraseña del dueño sin tocar clientes ni facturas. */
export async function updateOwnerCredentials(newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const owner =
    (await db.user.findFirst({
      where: { shopId: BRAND.shopId, role: "OWNER" },
    })) ??
    (await db.user.findFirst({
      where: {
        shopId: BRAND.shopId,
        email: { contains: "dancar", mode: "insensitive" },
      },
    }));

  if (!owner) {
    return { ok: false as const, error: "No se encontró usuario dueño del taller" };
  }

  const emailTaken = await db.user.findFirst({
    where: {
      email: NEW_OWNER_EMAIL,
      NOT: { id: owner.id },
    },
  });

  if (emailTaken) {
    return {
      ok: false as const,
      error: `El email ${NEW_OWNER_EMAIL} ya está en uso por otro usuario`,
    };
  }

  const previousEmail = owner.email;

  await db.user.update({
    where: { id: owner.id },
    data: {
      email: NEW_OWNER_EMAIL,
      passwordHash,
    },
  });

  return {
    ok: true as const,
    userId: owner.id,
    previousEmail,
    newEmail: NEW_OWNER_EMAIL,
  };
}
