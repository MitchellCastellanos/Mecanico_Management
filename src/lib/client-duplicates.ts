import { db } from "@/lib/db";
import { formatClientName } from "@/lib/client-name";

/** Solo dígitos; con 10+ dígitos compara los últimos 10 (ignora el prefijo +1). */
export function phoneKey(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function emailKey(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

export interface DuplicateMatch {
  id: string;
  name: string;
  field: "phone" | "email";
}

/** Busca otro cliente del taller con el mismo teléfono o email. */
export async function findDuplicateClients(
  shopId: string,
  { phone, email, excludeId }: { phone?: string | null; email?: string | null; excludeId?: string }
): Promise<DuplicateMatch[]> {
  const pKey = phoneKey(phone);
  const eKey = emailKey(email);
  if (pKey.length < 7 && !eKey) return [];

  const candidates = await db.client.findMany({
    where: { shopId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  });

  const matches: DuplicateMatch[] = [];
  for (const c of candidates) {
    const field =
      pKey.length >= 7 && phoneKey(c.phone) === pKey
        ? "phone"
        : eKey && emailKey(c.email) === eKey
          ? "email"
          : null;
    if (field) matches.push({ id: c.id, name: formatClientName(c), field });
  }
  return matches;
}

export function duplicateErrors(matches: DuplicateMatch[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const m of matches) {
    (errors[m.field] ??= []).push(
      `Ya existe un cliente con ${m.field === "phone" ? "este teléfono" : "este email"}: ${m.name}`
    );
  }
  return errors;
}
