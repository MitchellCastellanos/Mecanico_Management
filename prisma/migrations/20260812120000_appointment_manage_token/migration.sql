-- El cliente puede editar los datos de su propia cita agendada vía un link con token
ALTER TABLE "mecanico"."Appointment" ADD COLUMN "manageToken" TEXT;

CREATE UNIQUE INDEX "Appointment_manageToken_key" ON "mecanico"."Appointment"("manageToken");
