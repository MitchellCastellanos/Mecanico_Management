"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Link2, Loader2, Mail, MessageSquare } from "lucide-react";
import { sendAppointmentConfirmation, type AppointmentSendChannel } from "@/actions/appointments";
import { formatShopDateTime } from "@/lib/shop-timezone";

interface ClientManageLinkProps {
  appointmentId: string;
  manageUrl: string | null;
  slugMissing?: boolean;
  /** Solo citas activas (programada/confirmada) se pueden reenviar. */
  canResend: boolean;
  /** El cliente tiene teléfono y el taller tiene SMS de citas activado. */
  canSms: boolean;
  /** El cliente tiene email y el taller tiene emails de citas activados. */
  canEmail: boolean;
  clientPhone?: string | null;
  clientEmail?: string | null;
  confirmationSentAt: string | null;
  timeZone: string;
}

export function ClientManageLink({
  appointmentId,
  manageUrl,
  slugMissing,
  canResend,
  canSms,
  canEmail,
  clientPhone,
  clientEmail,
  confirmationSentAt,
  timeZone,
}: ClientManageLinkProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startSend] = useTransition();
  const [sendingChannel, setSendingChannel] = useState<AppointmentSendChannel | null>(null);

  if (slugMissing) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-medium">El cliente no puede gestionar la cita en línea todavía</p>
        <p className="mt-1 text-amber-800">
          Configura el enlace público (slug) en Configuración → Citas para generar el link de
          confirmación/cancelación.
        </p>
      </div>
    );
  }

  if (!manageUrl) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(manageUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  function handleResend(channel: AppointmentSendChannel) {
    setSendingChannel(channel);
    startSend(async () => {
      const result = await sendAppointmentConfirmation(appointmentId, channel);
      setSendingChannel(null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      const via = result.sentVia?.length ? ` por ${result.sentVia.join(" y ")}` : "";
      toast.success(`Confirmación reenviada${via}`);
      router.refresh();
    });
  }

  const sendButtonClass =
    "flex items-center gap-1 px-2.5 py-1.5 border border-teal-300 text-teal-800 hover:bg-teal-100 rounded-lg text-xs font-medium disabled:opacity-50";

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-teal-900">
        <Link2 className="w-4 h-4" />
        Link para que el cliente confirme o cancele su cita
      </div>
      <p className="text-xs text-teal-800">
        El cliente verá los detalles y podrá confirmar asistencia o cancelar. Los cambios de fecha u
        horario los hace el admin.
      </p>
      <div className="flex items-center gap-2">
        <a
          href={manageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-xs text-teal-700 break-all underline underline-offset-2"
        >
          {manageUrl}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-teal-300 text-teal-800 hover:bg-teal-100 rounded-lg text-xs font-medium shrink-0"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      {canResend && (
        <div className="pt-2 border-t border-teal-200 space-y-2">
          <p className="text-xs text-teal-800">
            {confirmationSentAt
              ? `Última confirmación enviada: ${formatShopDateTime(new Date(confirmationSentAt), timeZone)}`
              : "Aún no se ha enviado la confirmación al cliente."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending || !canSms}
              onClick={() => handleResend("sms")}
              title={canSms ? undefined : "El cliente no tiene teléfono o los SMS están desactivados"}
              className={sendButtonClass}
            >
              {sendingChannel === "sms" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MessageSquare className="w-3 h-3" />
              )}
              Reenviar por SMS{clientPhone && canSms ? ` (${clientPhone})` : ""}
            </button>
            <button
              type="button"
              disabled={pending || !canEmail}
              onClick={() => handleResend("email")}
              title={canEmail ? undefined : "El cliente no tiene email o los emails están desactivados"}
              className={sendButtonClass}
            >
              {sendingChannel === "email" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Mail className="w-3 h-3" />
              )}
              Reenviar por email{clientEmail && canEmail ? ` (${clientEmail})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
