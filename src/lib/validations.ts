// Schemas de validación Zod — importables desde Client y Server Components
// SIN "use server" para poder exportar objetos y tipos

import { z } from "zod";

export const clientSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(100),
  lastName: z.string().min(1, "El apellido es requerido").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const vehicleSchema = z.object({
  make: z.string().min(1, "La marca es requerida").max(50),
  model: z.string().min(1, "El modelo es requerido").max(50),
  year: z
    .number()
    .int()
    .min(1900, "Año inválido")
    .max(new Date().getFullYear() + 1, "Año inválido"),
  licensePlate: z.string().min(1, "La placa es requerida").max(20),
  vin: z.string().max(17).optional().or(z.literal("")),
  color: z.string().max(30).optional().or(z.literal("")),
  mileageUnit: z.enum(["KM", "MILES"]),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
