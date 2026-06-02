export type InvoiceLanguage = "ES" | "EN" | "FR";

export const INVOICE_LANGUAGES: { value: InvoiceLanguage; label: string }[] = [
  { value: "ES", label: "Español" },
  { value: "EN", label: "English" },
  { value: "FR", label: "Français" },
];

type Strings = {
  documentTitle: (num: string) => string;
  invoiceTitle: string;
  invoiceNo: string;
  date: string;
  due: string;
  status: string;
  billTo: string;
  vehicle: string;
  serviceDetails: string;
  phone: string;
  email: string;
  address: string;
  taxRegistration: string;
  plate: string;
  vin: string;
  color: string;
  mileageIn: string;
  mileageOut: string;
  mileageTraveled: string;
  colDescription: string;
  colType: string;
  colQty: string;
  colUnitPrice: string;
  colTotal: string;
  subtotal: string;
  tps: (pct: string) => string;
  tvq: (pct: string) => string;
  taxesTotal: string;
  grandTotal: string;
  notes: string;
  thankYou: string;
  itemTypes: Record<string, string>;
  statuses: Record<string, string>;
  months: string[];
};

const ES: Strings = {
  documentTitle: (num) => `Factura ${num}`,
  invoiceTitle: "FACTURA",
  invoiceNo: "No. de factura",
  date: "Fecha de emisión",
  due: "Fecha de vencimiento",
  status: "Estado",
  billTo: "Facturar a",
  vehicle: "Vehículo",
  serviceDetails: "Detalles del servicio",
  phone: "Teléfono",
  email: "Correo",
  address: "Dirección",
  taxRegistration: "Registro fiscal",
  plate: "Placa",
  vin: "VIN",
  color: "Color",
  mileageIn: "Km entrada",
  mileageOut: "Km salida",
  mileageTraveled: "Recorrido",
  colDescription: "Descripción",
  colType: "Tipo",
  colQty: "Cant.",
  colUnitPrice: "P. unitario",
  colTotal: "Importe",
  subtotal: "Subtotal",
  tps: (pct) => `TPS (${pct}%)`,
  tvq: (pct) => `TVQ (${pct}%)`,
  taxesTotal: "Total impuestos",
  grandTotal: "TOTAL A PAGAR",
  notes: "Notas y condiciones",
  thankYou: "Gracias por confiar en nosotros.",
  itemTypes: { LABOUR: "Mano de obra", PART: "Repuesto", OTHER: "Otro" },
  statuses: {
    PENDING: "PENDIENTE",
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
  invoiceNo: "Invoice number",
  date: "Issue date",
  due: "Due date",
  status: "Status",
  billTo: "Bill to",
  vehicle: "Vehicle",
  serviceDetails: "Service details",
  phone: "Phone",
  email: "Email",
  address: "Address",
  taxRegistration: "Tax registration",
  plate: "Plate",
  vin: "VIN",
  color: "Color",
  mileageIn: "Mileage in",
  mileageOut: "Mileage out",
  mileageTraveled: "Distance",
  colDescription: "Description",
  colType: "Type",
  colQty: "Qty",
  colUnitPrice: "Unit price",
  colTotal: "Amount",
  subtotal: "Subtotal",
  tps: (pct) => `GST (${pct}%)`,
  tvq: (pct) => `QST (${pct}%)`,
  taxesTotal: "Total tax",
  grandTotal: "AMOUNT DUE",
  notes: "Notes & terms",
  thankYou: "Thank you for your business.",
  itemTypes: { LABOUR: "Labour", PART: "Part", OTHER: "Other" },
  statuses: {
    PENDING: "PENDING",
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
  invoiceNo: "No de facture",
  date: "Date d'émission",
  due: "Date d'échéance",
  status: "Statut",
  billTo: "Facturer à",
  vehicle: "Véhicule",
  serviceDetails: "Détails du service",
  phone: "Téléphone",
  email: "Courriel",
  address: "Adresse",
  taxRegistration: "Enregistrement fiscal",
  plate: "Plaque",
  vin: "NIV",
  color: "Couleur",
  mileageIn: "Km entrée",
  mileageOut: "Km sortie",
  mileageTraveled: "Parcours",
  colDescription: "Description",
  colType: "Type",
  colQty: "Qté",
  colUnitPrice: "P. unit.",
  colTotal: "Montant",
  subtotal: "Sous-total",
  tps: (pct) => `TPS (${pct}%)`,
  tvq: (pct) => `TVQ (${pct}%)`,
  taxesTotal: "Total taxes",
  grandTotal: "TOTAL À PAYER",
  notes: "Notes et conditions",
  thankYou: "Merci de votre confiance.",
  itemTypes: { LABOUR: "Main-d'œuvre", PART: "Pièce", OTHER: "Autre" },
  statuses: {
    PENDING: "EN ATTENTE",
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

// ── i18n del correo de envío de factura ──────────────────────
// El idioma del email sigue al idioma de la factura (invoice.language),
// para que el cliente reciba el correo en su lengua.

export type EmailStrings = {
  htmlLang: string;
  subject: (num: string, shop: string) => string;
  preview: (num: string) => string;
  heading: string;
  greeting: (name: string) => string;
  intro: (shop: string) => string;
  paidIntro: (shop: string) => string;
  invoiceNo: string;
  totalLabel: string;
  dueLabel: string;
  statusLabel: string;
  attachmentNote: string;
  questions: string;
  footer: (shop: string) => string;
};

const EMAIL_ES: EmailStrings = {
  htmlLang: "es",
  subject: (num, shop) => `Tu factura ${num} de ${shop}`,
  preview: (num) => `Factura ${num} adjunta en PDF`,
  heading: "Tu factura",
  greeting: (name) => `Hola, ${name} 👋`,
  intro: (shop) =>
    `Adjuntamos tu factura de ${shop} en formato PDF. A continuación el resumen:`,
  paidIntro: (shop) =>
    `Gracias por tu pago. Adjuntamos tu factura pagada de ${shop} en formato PDF. A continuación el resumen:`,
  invoiceNo: "No. de factura",
  totalLabel: "Total",
  dueLabel: "Vence el",
  statusLabel: "Estado",
  attachmentNote: "📎 Encontrarás la factura completa en el PDF adjunto.",
  questions: "Si tienes cualquier pregunta, no dudes en contactarnos.",
  footer: (shop) => `Este correo fue enviado por ${shop}.`,
};

const EMAIL_EN: EmailStrings = {
  htmlLang: "en",
  subject: (num, shop) => `Your invoice ${num} from ${shop}`,
  preview: (num) => `Invoice ${num} attached as PDF`,
  heading: "Your invoice",
  greeting: (name) => `Hi ${name} 👋`,
  intro: (shop) =>
    `Please find your invoice from ${shop} attached as a PDF. Here is the summary:`,
  paidIntro: (shop) =>
    `Thank you for your payment. Your paid invoice from ${shop} is attached as a PDF. Here is the summary:`,
  invoiceNo: "Invoice number",
  totalLabel: "Total",
  dueLabel: "Due on",
  statusLabel: "Status",
  attachmentNote: "📎 The full invoice is in the attached PDF.",
  questions: "If you have any questions, feel free to reach out.",
  footer: (shop) => `This email was sent by ${shop}.`,
};

const EMAIL_FR: EmailStrings = {
  htmlLang: "fr",
  subject: (num, shop) => `Votre facture ${num} de ${shop}`,
  preview: (num) => `Facture ${num} jointe en PDF`,
  heading: "Votre facture",
  greeting: (name) => `Bonjour ${name} 👋`,
  intro: (shop) =>
    `Vous trouverez ci-joint votre facture de ${shop} au format PDF. Voici le résumé :`,
  paidIntro: (shop) =>
    `Merci pour votre paiement. Votre facture payée de ${shop} est jointe au format PDF. Voici le résumé :`,
  invoiceNo: "No de facture",
  totalLabel: "Total",
  dueLabel: "Échéance le",
  statusLabel: "Statut",
  attachmentNote: "📎 La facture complète se trouve dans le PDF joint.",
  questions: "Pour toute question, n'hésitez pas à nous contacter.",
  footer: (shop) => `Ce courriel a été envoyé par ${shop}.`,
};

const EMAIL_MAP: Record<InvoiceLanguage, EmailStrings> = {
  ES: EMAIL_ES,
  EN: EMAIL_EN,
  FR: EMAIL_FR,
};

export function getInvoiceEmailStrings(
  language: InvoiceLanguage | string | null | undefined
): EmailStrings {
  const key = (language ?? "ES") as InvoiceLanguage;
  return EMAIL_MAP[key] ?? EMAIL_ES;
}
