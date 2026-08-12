import { randomBytes } from "crypto";

/** Token opaco para el link de auto-gestión de citas del cliente (sin login). */
export function generateAppointmentManageToken(): string {
  return randomBytes(24).toString("base64url");
}
