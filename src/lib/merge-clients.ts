import { db } from "@/lib/db";

/**
 * Fusiona un cliente duplicado dentro del cliente a conservar, en una sola
 * transacción. Las facturas, cotizaciones, citas y recordatorios no se pierden;
 * los vehículos con la misma placa se unifican.
 */
export async function mergeClientRecords(shopId: string, keepId: string, duplicateId: string) {
  const [keep, dup] = await Promise.all([
    db.client.findFirst({ where: { id: keepId, shopId }, include: { vehicles: true } }),
    db.client.findFirst({ where: { id: duplicateId, shopId }, include: { vehicles: true } }),
  ]);
  if (!keep || !dup) return { error: "Cliente no encontrado" } as const;

  await db.$transaction(async (tx) => {
    for (const v of dup.vehicles) {
      const plate = v.licensePlate.trim().toLowerCase();
      const twin = plate ? keep.vehicles.find((k) => k.licensePlate.trim().toLowerCase() === plate) : null;
      if (twin) {
        const where = { vehicleId: v.id };
        const data = { vehicleId: twin.id };
        await tx.invoiceVehicle.updateMany({ where, data });
        await tx.quoteVehicle.updateMany({ where, data });
        await tx.appointment.updateMany({ where, data });
        await tx.serviceReminder.updateMany({ where, data });
        await tx.vehicle.delete({ where: { id: v.id } });
      } else {
        await tx.vehicle.update({ where: { id: v.id }, data: { clientId: keepId } });
      }
    }

    await tx.invoice.updateMany({ where: { clientId: duplicateId }, data: { clientId: keepId } });
    await tx.quote.updateMany({ where: { clientId: duplicateId }, data: { clientId: keepId } });
    await tx.appointment.updateMany({ where: { clientId: duplicateId }, data: { clientId: keepId } });

    const notes = [keep.notes, dup.notes].filter(Boolean).join("\n---\n");
    await tx.client.update({
      where: { id: keepId },
      data: {
        email: keep.email ?? dup.email,
        phone: keep.phone ?? dup.phone,
        address: keep.address ?? dup.address,
        notes: notes || null,
      },
    });
    await tx.client.delete({ where: { id: duplicateId } });
  });

  return { ok: true } as const;
}
