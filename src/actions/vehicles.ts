"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { vehicleSchema, type VehicleFormData } from "@/lib/validations";

async function getShopId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.shopId) redirect("/login");
  return session.user.shopId;
}

export async function getVehicleById(vehicleId: string) {
  const shopId = await getShopId();

  // Verificamos acceso via el cliente dueño del vehículo
  const vehicle = await db.vehicle.findFirst({
    where: {
      id: vehicleId,
      client: { shopId },
    },
    include: {
      client: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      reminders: {
        where: { status: { not: "DISMISSED" } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vehicle) redirect("/clients");
  return vehicle;
}

export async function createVehicle(clientId: string, formData: VehicleFormData) {
  const shopId = await getShopId();

  // Verificar que el cliente pertenece a este shop
  const client = await db.client.findFirst({ where: { id: clientId, shopId } });
  if (!client) redirect("/clients");

  const parsed = vehicleSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { make, model, year, licensePlate, vin, color, mileageUnit } = parsed.data;

  await db.vehicle.create({
    data: {
      clientId,
      make,
      model,
      year,
      licensePlate,
      vin: vin || null,
      color: color || null,
      mileageUnit,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function updateVehicle(vehicleId: string, formData: VehicleFormData) {
  const shopId = await getShopId();

  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId, client: { shopId } },
  });
  if (!vehicle) redirect("/clients");

  const parsed = vehicleSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { make, model, year, licensePlate, vin, color, mileageUnit } = parsed.data;

  await db.vehicle.update({
    where: { id: vehicleId },
    data: {
      make,
      model,
      year,
      licensePlate,
      vin: vin || null,
      color: color || null,
      mileageUnit,
    },
  });

  revalidatePath(`/clients/${vehicle.clientId}`);
  redirect(`/clients/${vehicle.clientId}`);
}

export async function deleteVehicle(vehicleId: string, clientId: string) {
  const shopId = await getShopId();

  await db.vehicle.deleteMany({
    where: { id: vehicleId, client: { shopId } },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
