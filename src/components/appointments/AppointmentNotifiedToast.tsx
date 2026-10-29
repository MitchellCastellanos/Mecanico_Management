"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Avisa al admin si la confirmación de una cita recién creada salió al cliente, y limpia el parámetro. */
export function AppointmentNotifiedToast({ notified }: { notified?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!notified) return;

    if (notified === "nocontact") {
      toast.warning("Cita guardada, pero el cliente no tiene teléfono ni email: no se envió confirmación");
    } else if (notified === "failed") {
      toast.error("Cita guardada, pero no se pudo notificar al cliente. Usa «Confirmar» para reintentar");
    } else {
      const [kind, list] = notified.includes(":") ? notified.split(":") : ["create", notified];
      const channels = list.split(",").map((c) => (c === "sms" ? "SMS" : "email")).join(" y ");
      toast.success(
        kind === "cancel"
          ? `Cita cancelada. Aviso enviado por ${channels}`
          : kind === "update"
          ? `Cita actualizada. Nueva confirmación enviada por ${channels}`
          : `Cita creada. Confirmación enviada por ${channels}`
      );
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("notified");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [notified, pathname, router, searchParams]);

  return null;
}
