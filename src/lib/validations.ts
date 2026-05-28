// Schemas de validación Zod — importables desde Client y Server Components
// SIN "use server" para poder exportar objetos y tipos

import { z } from "zod";

export const clientSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
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

// ── Factura ──────────────────────────────────────────────────

export const lineItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida").max(255),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "El precio no puede ser negativo"),
  itemType: z.enum(["LABOUR", "PART", "OTHER"]),
});

export type LineItemData = z.infer<typeof lineItemSchema>;

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  vehicleId: z.string().min(1, "Selecciona un vehículo"),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "Agrega al menos una línea de servicio"),
  taxRate: z.number().min(0).max(1), // 0.14975 = TPS+TVQ Quebec
  language: z.enum(["ES", "EN", "FR"]).default("ES"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  mileageIn: z.number().int().min(0).optional().nullable(),
  mileageOut: z.number().int().min(0).optional().nullable(),
  dueAt: z.string().optional().or(z.literal("")), // ISO date string
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ── Recordatorio de servicio ──────────────────────────────────

export const reminderSchema = z.object({
  vehicleId: z.string().min(1, "Selecciona un vehículo"),
  serviceType: z.string().min(1, "El tipo de servicio es requerido").max(100),
  dueDate: z.string().optional().or(z.literal("")), // ISO date string
  dueMileage: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

// ── Documentos contables ──────────────────────────────────────

export const DOC_CATEGORIES = [
  { value: "INVOICES", label: "Facturas" },
  { value: "RECEIPTS", label: "Recibos" },
  { value: "PAYROLL", label: "Nómina" },
  { value: "TAX_DOCUMENTS", label: "Documentos Fiscales" },
  { value: "BANK_STATEMENTS", label: "Estados de Cuenta" },
  { value: "OTHER", label: "Otros" },
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number]["value"];
