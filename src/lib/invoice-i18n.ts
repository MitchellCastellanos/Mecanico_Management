export type InvoiceLanguage = "ES" | "EN" | "FR";

export const INVOICE_LANGUAGES: { value: InvoiceLanguage; label: string }[] = [
  { value: "ES", label: "Español" },
  { value: "EN", label: "English" },
  { value: "FR", label: "Français" },
];

type Strings = {
  documentTitle: (num: string) => string;
  invoiceTitle: string;
  date: string;
  due: string;
  billTo: string;
  vehicle: string;
  plate: string;
  mileageIn: string;
  mileageOut: string;
  colDescription: string;
  colType: string;
  colQty: string;
  colUnitPrice: string;
  colTotal: string;
  subtotal: string;
  tps: (pct: string) => string;
  tvq: (pct: string) => string;
  grandTotal: string;
  notes: string;
  itemTypes: Record<string, string>;
  statuses: Record<string, string>;
  months: string[];
};

const ES: Strings = {
  documentTitle: (num) => `Factura ${num}`,
  invoiceTitle: "FACTURA",
  date: "Fecha",
  due: "Vence",
  billTo: "Facturar a",
  vehicle: "Vehículo",
  plate: "Placa",
  mileageIn: "Entrada",
  mileageOut: "Salida",
  colDescription: "Descripción",
  colType: "Tipo",
  colQty: "Cant.",
  colUnitPrice: "P. Unit.",
  colTotal: "Total",
  subtotal: "Subtotal",
  tps: (pct) => `TPS (${pct}%)`,
  tvq: (pct) => `TVQ (${pct}%)`,
  grandTotal: "TOTAL CAD",
  notes: "Notas",
  itemTypes: { LABOUR: "Mano de obra", PART: "Repuesto", OTHER: "Otro" },
  statuses: {
    DRAFT: "BORRADOR",
    SENT: "ENVIADA",
    PAID: "PAGADA",
    OVERDUE: "VENCIDA",
    CANCELLED: "CANCELADA",
  },
  months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
};

const EN: Strings = {
  documentTitle: (num) => `Invoice ${num}`,
  invoiceTitle: "INVOICE",
  date: "Date",
  due: "Due",
  billTo: "Bill to",
  vehicle: "Vehicle",
  plate: "Plate",
  mileageIn: "In",
  mileageOut: "Out",
  colDescription: "Description",
  colType: "Type",
  colQty: "Qty",
  colUnitPrice: "Unit price",
  colTotal: "Total",
  subtotal: "Subtotal",
  tps: (pct) => `GST (${pct}%)`,
  tvq: (pct) => `QST (${pct}%)`,
  grandTotal: "TOTAL CAD",
  notes: "Notes",
  itemTypes: { LABOUR: "Labour", PART: "Part", OTHER: "Other" },
  statuses: {
    DRAFT: "DRAFT",
    SENT: "SENT",
    PAID: "PAID",
    OVERDUE: "OVERDUE",
    CANCELLED: "CANCELLED",
  },
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const FR: Strings = {
  documentTitle: (num) => `Facture ${num}`,
  invoiceTitle: "FACTURE",
  date: "Date",
  due: "Échéance",
  billTo: "Facturer à",
  vehicle: "Véhicule",
  plate: "Plaque",
  mileageIn: "Entrée",
  mileageOut: "Sortie",
  colDescription: "Description",
  colType: "Type",
  colQty: "Qté",
  colUnitPrice: "P. unit.",
  colTotal: "Total",
  subtotal: "Sous-total",
  tps: (pct) => `TPS (${pct}%)`,
  tvq: (pct) => `TVQ (${pct}%)`,
  grandTotal: "TOTAL CAD",
  notes: "Notes",
  itemTypes: { LABOUR: "Main-d'œuvre", PART: "Pièce", OTHER: "Autre" },
  statuses: {
    DRAFT: "BROUILLON",
    SENT: "ENVOYÉE",
    PAID: "PAYÉE",
    OVERDUE: "EN RETARD",
    CANCELLED: "ANNULÉE",
  },
  months: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

const MAP: Record<InvoiceLanguage, Strings> = { ES, EN, FR };

export function getInvoiceStrings(language: InvoiceLanguage | string | null | undefined): Strings {
  const key = (language ?? "ES") as InvoiceLanguage;
  return MAP[key] ?? ES;
}
