-- El teléfono pasa a ser el canal principal de notificaciones de citas (SMS vía Twilio)
ALTER TABLE "mecanico"."Shop" ADD COLUMN "appointmentSmsEnabled" BOOLEAN NOT NULL DEFAULT true;
