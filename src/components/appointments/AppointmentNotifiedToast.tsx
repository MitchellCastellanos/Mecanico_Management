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
      toast.warning("Cita creada, pero el cliente no tiene teléfono ni email: no se envió confirmación");
    } else if (notified === "failed") {
      toast.error("Cita creada, pero no se pudo enviar la confirmación. Usa «Confirmar» para reintentar");
    } else {
      const channels = notified.split(",").map((c) => (c === "sms" ? "SMS" : "email"));
      toast.success(`Cita creada. Confirmación enviada por ${channels.join(" y ")}`);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("notified");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [notified, pathname, router, searchParams]);

  return null;
}
