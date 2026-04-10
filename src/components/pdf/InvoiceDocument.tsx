// PDF Template — @react-pdf/renderer
//
// IMPORTANTE: Este es un árbol React SEPARADO del DOM.
// Aquí NO puedes usar:
//   ❌ clases Tailwind
//   ❌ elementos HTML (div, p, table...)
//   ❌ hooks de React
//   ❌ window/document
//
// Aquí SÍ puedes usar:
//   ✅ <Document>, <Page>, <View>, <Text>, <Image> de @react-pdf/renderer
//   ✅ StyleSheet.create() para los estilos (CSS subset)
//   ✅ Props normales de React

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Tipos para los datos que recibe el PDF
interface LineItem {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  itemType: string;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  dueAt?: Date | null;
  mileageIn?: number | null;
  mileageOut?: number | null;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  total: string | number;
  notes?: string | null;
  lineItems: LineItem[];
  client: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    mileageUnit: string;
  };
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
    logoUrl?: string | null;
  };
}

// Paleta de colores
const BLUE = "#1d4ed8";
const SLATE_900 = "#0f172a";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_100 = "#f1f5f9";
const EMERALD = "#059669";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: SLATE_900,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  shopBlock: { maxWidth: 220 },
  shopName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 4 },
  shopMeta: { fontSize: 8.5, color: SLATE_600, lineHeight: 1.5 },
  invoiceLabel: { fontSize: 28, fontFamily: "Helvetica-Bold", color: SLATE_100, textAlign: "right" },
  invoiceNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", color: BLUE, textAlign: "right", marginTop: 2 },
  invoiceDate: { fontSize: 9, color: SLATE_600, textAlign: "right", marginTop: 4 },
  // ── Divider ──
  divider: { height: 1, backgroundColor: SLATE_100, marginVertical: 16 },
  // ── Bill To / Vehicle ──
  infoRow: { flexDirection: "row", gap: 24, marginBottom: 24 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: SLATE_400, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  infoValue: { fontSize: 9.5, color: SLATE_900, lineHeight: 1.6 },
  infoValueBold: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: SLATE_900 },
  // ── Table ──
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: BLUE, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 4 },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: WHITE },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: SLATE_100 },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 9, color: SLATE_600 },
  tableCellDark: { fontSize: 9, color: SLATE_900 },
  colDesc: { flex: 4 },
  colType: { flex: 1.5 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  // ── Totals ──
  totalsBlock: { alignSelf: "flex-end", width: 200, marginBottom: 24 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: SLATE_600 },
  totalValue: { fontSize: 9, color: SLATE_900 },
  totalDivider: { height: 1, backgroundColor: SLATE_100, marginVertical: 6 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4 },
  grandTotalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: WHITE },
  grandTotalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: WHITE },
  // ── Notes & Footer ──
  notesBlock: { marginBottom: 24 },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SLATE_400, textTransform: "uppercase", marginBottom: 4 },
  notesText: { fontSize: 9, color: SLATE_600, lineHeight: 1.5 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 8 },
  statusText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48 },
  footerText: { fontSize: 8, color: SLATE_400, textAlign: "center" },
  mileageRow: { flexDirection: "row", gap: 16, marginTop: 6 },
  mileagePill: { flexDirection: "row", gap: 4 },
  mileageLabel: { fontSize: 8, color: SLATE_400 },
  mileageValue: { fontSize: 8, color: SLATE_600 },
});

// Helpers de formato (sin Intl — no disponible en todos los entornos de PDF)
function fmtCurrency(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const months = ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function fmtQty(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

const itemTypeLabel: Record<string, string> = {
  LABOUR: "Mano de obra",
  PART: "Repuesto",
  OTHER: "Otro",
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: "#f1f5f9", color: SLATE_600, label: "BORRADOR" },
  SENT: { bg: "#dbeafe", color: BLUE, label: "ENVIADA" },
  PAID: { bg: "#d1fae5", color: EMERALD, label: "PAGADA" },
  OVERDUE: { bg: "#fee2e2", color: "#dc2626", label: "VENCIDA" },
  CANCELLED: { bg: "#f1f5f9", color: SLATE_400, label: "CANCELADA" },
};

// ── Componente principal ─────────────────────────────────────

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const status = statusConfig[invoice.status] ?? statusConfig.DRAFT;
  const taxPct = (parseFloat(invoice.taxRate.toString()) * 100).toFixed(3);

  return (
    <Document
      title={`Factura ${invoice.invoiceNumber}`}
      author={invoice.shop.name}
    >
      <Page size="LETTER" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Logo / Shop info */}
          <View style={styles.shopBlock}>
            {invoice.shop.logoUrl && (
              <Image
                src={invoice.shop.logoUrl}
                style={{ width: 80, height: 40, objectFit: "contain", marginBottom: 8 }}
              />
            )}
            <Text style={styles.shopName}>{invoice.shop.name}</Text>
            <Text style={styles.shopMeta}>
              {[
                invoice.shop.address,
                invoice.shop.phone,
                invoice.shop.email,
                invoice.shop.taxId,
              ]
                .filter(Boolean)
                .join("\n")}
            </Text>
          </View>

          {/* Invoice number block */}
          <View>
            <Text style={styles.invoiceLabel}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Fecha: {fmtDate(invoice.issuedAt)}
            </Text>
            {invoice.dueAt && (
              <Text style={styles.invoiceDate}>
                Vence: {fmtDate(invoice.dueAt)}
              </Text>
            )}
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: status.bg, marginTop: 8, alignSelf: "flex-end" }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Facturar a / Vehículo ── */}
        <View style={styles.infoRow}>
          {/* Cliente */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Facturar a</Text>
            <Text style={styles.infoValueBold}>
              {invoice.client.firstName} {invoice.client.lastName}
            </Text>
            <Text style={styles.infoValue}>
              {[invoice.client.email, invoice.client.phone, invoice.client.address]
                .filter(Boolean)
                .join("\n")}
            </Text>
          </View>

          {/* Vehículo */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Vehículo</Text>
            <Text style={styles.infoValueBold}>
              {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
            </Text>
            <Text style={styles.infoValue}>
              Placa: {invoice.vehicle.licensePlate}
            </Text>
            {/* Km entrada / salida */}
            {(invoice.mileageIn || invoice.mileageOut) && (
              <View style={styles.mileageRow}>
                {invoice.mileageIn && (
                  <View style={styles.mileagePill}>
                    <Text style={styles.mileageLabel}>Entrada:</Text>
                    <Text style={styles.mileageValue}>
                      {invoice.mileageIn.toLocaleString()} {invoice.vehicle.mileageUnit}
                    </Text>
                  </View>
                )}
                {invoice.mileageOut && (
                  <View style={styles.mileagePill}>
                    <Text style={styles.mileageLabel}>Salida:</Text>
                    <Text style={styles.mileageValue}>
                      {invoice.mileageOut.toLocaleString()} {invoice.vehicle.mileageUnit}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── Tabla de líneas ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Tipo</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Rows */}
          {invoice.lineItems.map((item, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCellDark, styles.colDesc]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colType]}>
                {itemTypeLabel[item.itemType] ?? item.itemType}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {fmtQty(item.quantity)}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmtCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCellDark, styles.colTotal]}>
                {fmtCurrency(item.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totales ── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TPS + TVQ ({taxPct}%)</Text>
            <Text style={styles.totalValue}>{fmtCurrency(invoice.taxAmount)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL CAD</Text>
            <Text style={styles.grandTotalValue}>{fmtCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* ── Notas ── */}
        {invoice.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notas</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={[styles.divider, { marginBottom: 8 }]} />
          <Text style={styles.footerText}>
            {invoice.shop.name}
            {invoice.shop.phone ? ` · ${invoice.shop.phone}` : ""}
            {invoice.shop.email ? ` · ${invoice.shop.email}` : ""}
          </Text>
          {invoice.shop.taxId && (
            <Text style={[styles.footerText, { marginTop: 2 }]}>
              {invoice.shop.taxId}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
