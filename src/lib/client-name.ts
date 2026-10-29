/** Nombre para mostrar: siempre firstName + lastName (sin invertir). Empresas pueden omitir lastName. */
export function formatClientName(client: {
  firstName: string;
  lastName?: string | null;
}): string {
  const first = client.firstName.trim();
  const last = client.lastName?.trim();
  if (!last) return first;
  return `${first} ${last}`;
}

/** Compara por nombre mostrado (A→Z, sin distinguir mayúsculas ni acentos). */
export function compareClientNames(
  a: { firstName: string; lastName?: string | null },
  b: { firstName: string; lastName?: string | null }
): number {
  return formatClientName(a).localeCompare(formatClientName(b), "es", { sensitivity: "base" });
}

/** Copia ordenada alfabéticamente por el nombre que realmente se muestra. */
export function sortClientsByName<T extends { firstName: string; lastName?: string | null }>(
  clients: T[]
): T[] {
  return [...clients].sort(compareClientNames);
}

/** Etiqueta de cita para el calendario: "Cliente - Marca Modelo" (solo el cliente si no hay vehículo). */
export function formatAppointmentLabel(
  client: { firstName: string; lastName?: string | null } | null | undefined,
  vehicle?: { make: string; model: string } | null
): string {
  // Una cita con cliente ausente no debe tumbar toda la página del calendario.
  const name = client ? formatClientName(client) : "Sin cliente";
  const car = vehicle ? `${vehicle.make} ${vehicle.model}`.trim() : "";
  return car ? `${name} - ${car}` : name;
}
