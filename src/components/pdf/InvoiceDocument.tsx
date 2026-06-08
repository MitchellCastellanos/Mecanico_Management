// PDF Template — @react-pdf/renderer

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { formatClientName } from "@/lib/client-name";
import { calculateTaxBreakdown, TPS_RATE, TVQ_RATE } from "@/lib/taxes";
import { getInvoiceStrings, type InvoiceLanguage } from "@/lib/invoice-i18n";
import { invoiceStatusLabelForPdf } from "@/lib/invoice-status";
import Decimal from "decimal.js";

// Por defecto @react-pdf parte palabras a media sílaba cuando no caben en la
// línea (p. ej. "LA-CHINE"). Desactivamos la silabación: una palabra que no
// quepa salta entera a la siguiente línea en vez de cortarse.
Font.registerHyphenationCallback((word) => [word]);

interface LineItem {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  itemType: string;
  warrantyTerm?: string | null;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  dueAt?: Date | null;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  total: string | number;
  language?: InvoiceLanguage | string | null;
  notes?: string | null;
  documentKind?: "invoice" | "quote";
  /** Factura pagada en efectivo: PDF sin desglose de impuestos. */
  suppressTaxes?: boolean;
  client: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  vehicles: {
    mileageIn?: number | null;
    mileageOut?: number | null;
    lineItems: LineItem[];
    vehicle: {
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      mileageUnit: string;
      vin?: string | null;
      color?: string | null;
    };
  }[];
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
    logoUrl?: string | null;
    currency?: string | null;
  };
}

const NAVY = "#0f2744";
const BLUE = "#1d4ed8";
const BLUE_LIGHT = "#eff6ff";
const SLATE_900 = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_200 = "#e2e8f0";
const SLATE_100 = "#f1f5f9";
const SLATE_50 = "#f8fafc";
const EMERALD = "#059669";
const WHITE = "#ffffff";

const LOGO_WIDTH = 150;
const LOGO_HEIGHT = 128;
const PAGE_PAD = 40;
const FOOTER_H = 52;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: SLATE_900,
    backgroundColor: WHITE,
    paddingTop: 0,
    paddingBottom: FOOTER_H + 14,
    paddingHorizontal: PAGE_PAD,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: SLATE_200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 16,
  },
  brandCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },
  logoArea: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    flexShrink: 0,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    objectFit: "contain",
    objectPosition: "left top",
  },
  logoPlaceholderText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
  },
  shopInfo: {
    flex: 1,
    minWidth: 0,
  },
  shopName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 6,
  },
  contactLine: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  contactLabel: {
    fontSize: 7.5,
    color: SLATE_400,
    width: 52,
    flexShrink: 0,
    paddingTop: 1,
  },
  contactValue: {
    fontSize: 8.5,
    color: SLATE_700,
    flex: 1,
    lineHeight: 1.45,
  },
  invoicePanel: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 188,
    flexShrink: 0,
    justifyContent: "space-between",
  },
  invoiceTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    letterSpacing: 1,
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
    gap: 8,
  },
  metaLabel: { fontSize: 7.5, color: SLATE_600, width: 72 },
  metaValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    flex: 1,
    textAlign: "right",
  },
  metaBottom: {
    marginTop: 10,
  },
  metaDivider: {
    height: 1,
    backgroundColor: SLATE_200,
    marginBottom: 8,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-end",
  },
  statusText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  body: {
    paddingTop: 14,
    position: "relative",
  },
  vehicleGroup: {
    marginBottom: 14,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    minWidth: 0,
  },
  cardHeader: {
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 6,
    lineHeight: 1.35,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  detailRowStacked: {
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 7.5,
    color: SLATE_400,
    width: 44,
    flexShrink: 0,
    paddingTop: 1,
  },
  detailValue: {
    fontSize: 8.5,
    color: SLATE_700,
    flex: 1,
    lineHeight: 1.35,
  },
  detailValueStacked: {
    fontSize: 8.5,
    color: SLATE_700,
    width: "100%",
    marginTop: 2,
    lineHeight: 1.35,
  },
  mileageBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  mileagePill: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mileagePillLabel: { fontSize: 6.5, color: BLUE, fontFamily: "Helvetica-Bold" },
  mileagePillValue: { fontSize: 7.5, color: NAVY, marginTop: 1 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_600,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  lineItemsSection: {
    position: "relative",
    marginBottom: 14,
  },
  paidWatermark: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  paidWatermarkText: {
    fontSize: 72,
    fontFamily: "Helvetica-Bold",
    color: EMERALD,
    opacity: 0.14,
    letterSpacing: 6,
    transform: "rotate(-38deg)",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: SLATE_200,
    alignItems: "flex-start",
  },
  tableRowLast: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 1,
  },
  tableRowAlt: { backgroundColor: SLATE_50 },
  tableCell: { fontSize: 8.5, color: SLATE_600, lineHeight: 1.4 },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    lineHeight: 1.4,
  },
  colDesc: { flex: 4, paddingRight: 6, minWidth: 0 },
  colType: { flex: 1.3, paddingRight: 4, minWidth: 0 },
  colQty: { flex: 0.8, textAlign: "right" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  bottomRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    marginTop: 4,
  },
  notesCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    padding: 10,
    minWidth: 0,
  },
  notesLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  notesText: { fontSize: 8.5, color: SLATE_600, lineHeight: 1.5 },
  warrantyCard: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  warrantyTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: SLATE_900,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  warrantyIntro: {
    fontSize: 7.5,
    color: SLATE_600,
    lineHeight: 1.45,
    marginBottom: 8,
  },
  warrantyItem: {
    fontSize: 8,
    color: SLATE_700,
    marginBottom: 3,
    paddingLeft: 8,
  },
  totalsCard: {
    width: 230,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    flexShrink: 0,
  },
  totalsHeader: {
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  totalsHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_600,
    textTransform: "uppercase",
  },
  totalsBody: { paddingHorizontal: 12, paddingVertical: 6 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    gap: 8,
  },
  totalLabel: { fontSize: 8.5, color: SLATE_600, flex: 1 },
  totalValue: { fontSize: 8.5, color: SLATE_900, flexShrink: 0 },
  totalDivider: {
    height: 1,
    backgroundColor: SLATE_200,
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: NAVY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    flex: 1,
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    flexShrink: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    borderTopWidth: 1,
    borderTopColor: SLATE_200,
    backgroundColor: SLATE_50,
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 10,
    justifyContent: "center",
  },
  footerThank: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    marginBottom: 3,
  },
  footerMeta: {
    fontSize: 7,
    color: SLATE_400,
    textAlign: "center",
    lineHeight: 1.45,
  },
});

function fmtCurrency(val: string | number, currency = "CAD"): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  const formatted = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return currency === "CAD" ? `$${formatted}` : `${formatted} ${currency}`;
}

function fmtDate(d: Date | string, months: string[]): string {
  const date = new Date(d);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function fmtQty(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: SLATE_200, color: SLATE_700 },
  SENT: { bg: "#dbeafe", color: BLUE },
  PAID: { bg: "#d1fae5", color: EMERALD },
  OVERDUE: { bg: "#fee2e2", color: "#dc2626" },
  CANCELLED: { bg: SLATE_100, color: SLATE_400 },
  ACCEPTED: { bg: "#d1fae5", color: EMERALD },
  REJECTED: { bg: "#fee2e2", color: "#dc2626" },
  EXPIRED: { bg: "#ffedd5", color: "#ea580c" },
  CONVERTED: { bg: "#e0e7ff", color: "#4338ca" },
};

// Separa un taxId tipo "TPS: 123...RT0001  TVQ: 456...TQ0001" en líneas
// independientes para que cada número quede alineado junto a su etiqueta corta.
// Si no reconoce el formato, retorna null para mostrarlo como una sola línea.
function parseTaxRegistration(
  taxId: string
): { label: string; value: string }[] | null {
  const re = /(TPS|TVQ|GST|QST|HST|TVH)\s*[:#]?\s*([A-Za-z0-9]+)/gi;
  const segments: { label: string; value: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(taxId)) !== null) {
    segments.push({ label: m[1].toUpperCase(), value: m[2] });
  }
  return segments.length > 0 ? segments : null;
}

function ContactLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  const isLong = value.length > 42;
  if (isLong) {
    return (
      <View style={{ marginBottom: 4 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, { marginTop: 2 }]}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={styles.contactLine}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  stacked,
}: {
  label: string;
  value?: string | null;
  stacked?: boolean;
}) {
  if (!value) return null;
  const useStacked = stacked || value.length > 36;
  if (useStacked) {
    return (
      <View style={styles.detailRowStacked}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValueStacked}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function InvoiceHeader({
  invoice,
  t,
  statusLabel,
  statusColors,
}: {
  invoice: InvoiceData;
  t: ReturnType<typeof getInvoiceStrings>;
  statusLabel: string;
  statusColors: { bg: string; color: string };
}) {
  return (
    <View wrap={false}>
      <View style={styles.header}>
        <View style={styles.brandCol}>
          <View style={styles.logoArea}>
            {invoice.shop.logoUrl ? (
              <Image src={invoice.shop.logoUrl} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoPlaceholderText}>{invoice.shop.name}</Text>
            )}
          </View>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{invoice.shop.name}</Text>
            <ContactLine label={t.phone} value={invoice.shop.phone} />
            <ContactLine label={t.email} value={invoice.shop.email} />
            <ContactLine label={t.address} value={invoice.shop.address} />
            {(() => {
              if (!invoice.shop.taxId) return null;
              const segments = parseTaxRegistration(invoice.shop.taxId);
              if (!segments) {
                return (
                  <ContactLine label={t.taxRegistration} value={invoice.shop.taxId} />
                );
              }
              return segments.map((seg) => (
                <ContactLine key={seg.label} label={seg.label} value={seg.value} />
              ));
            })()}
          </View>
        </View>

        <View style={styles.invoicePanel}>
          <View>
            <Text style={styles.invoiceTitle}>
              {invoice.documentKind === "quote" ? t.quoteTitle : t.invoiceTitle}
            </Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaBottom}>
            <View style={styles.metaDivider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.date}</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issuedAt, t.months)}</Text>
            </View>
            {invoice.dueAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  {invoice.documentKind === "quote" ? t.validUntil : t.due}
                </Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.dueAt, t.months)}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.color }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function InvoiceFooter({
  invoice,
  t,
}: {
  invoice: InvoiceData;
  t: ReturnType<typeof getInvoiceStrings>;
}) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerThank}>{t.thankYou}</Text>
      <Text style={styles.footerMeta}>
        {invoice.shop.name}
        {invoice.shop.phone ? ` · ${invoice.shop.phone}` : ""}
        {invoice.shop.email ? ` · ${invoice.shop.email}` : ""}
      </Text>
    </View>
  );
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const t = getInvoiceStrings(invoice.language);
  const isQuote = invoice.documentKind === "quote";
  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.DRAFT;
  const statusLabel = invoiceStatusLabelForPdf(t.statuses, invoice.status);
  const showPaidWatermark = !isQuote && invoice.status === "PAID";
  const currency = invoice.shop.currency ?? "CAD";
  const docTitle = isQuote
    ? `Cotización ${invoice.invoiceNumber}`
    : t.documentTitle(invoice.invoiceNumber);

  const { tpsAmount, tvqAmount, taxAmount } = calculateTaxBreakdown(
    invoice.subtotal,
    invoice.taxRate
  );
  const factor = new Decimal(invoice.taxRate).div(TPS_RATE + TVQ_RATE);
  const tpsPct = new Decimal(TPS_RATE).times(factor).times(100).toFixed(2);
  const tvqPct = new Decimal(TVQ_RATE).times(factor).times(100).toFixed(2);

  const allLineItems = invoice.vehicles.flatMap((v) => v.lineItems);
  const warrantyItems = allLineItems.filter(
    (item) => item.itemType === "PART" && item.warrantyTerm?.trim()
  );
  const suppressTaxes = Boolean(invoice.suppressTaxes);
  const showVehicleNumbers = invoice.vehicles.length > 1;

  return (
    <Document title={docTitle} author={invoice.shop.name}>
      <Page size="LETTER" style={styles.page} wrap>
        <InvoiceHeader
          invoice={invoice}
          t={t}
          statusLabel={statusLabel}
          statusColors={statusColors}
        />

        <View style={styles.body}>
          {showPaidWatermark && (
            <View style={styles.paidWatermark}>
              <Text style={styles.paidWatermarkText}>{t.paidWatermark}</Text>
            </View>
          )}

          <View style={styles.cardsRow} wrap={false}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>{t.billTo}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{formatClientName(invoice.client)}</Text>
                <DetailRow label={t.email} value={invoice.client.email} />
                <DetailRow label={t.phone} value={invoice.client.phone} />
                <DetailRow label={t.address} value={invoice.client.address} stacked />
              </View>
            </View>
          </View>

          {invoice.vehicles.map((iv, vIndex) => {
            const mileageDelta =
              iv.mileageIn != null && iv.mileageOut != null
                ? iv.mileageOut - iv.mileageIn
                : null;
            const lastIndex = iv.lineItems.length - 1;
            const vehicleLabel = showVehicleNumbers
              ? `${t.vehicle} ${vIndex + 1}`
              : t.vehicle;

            return (
              <View key={vIndex} style={styles.vehicleGroup}>
                <View style={styles.cardsRow} wrap={false}>
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardHeaderText}>{vehicleLabel}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>
                        {iv.vehicle.year} {iv.vehicle.make} {iv.vehicle.model}
                      </Text>
                      <DetailRow label={t.plate} value={iv.vehicle.licensePlate} />
                      <DetailRow label={t.vin} value={iv.vehicle.vin} stacked />
                      <DetailRow label={t.color} value={iv.vehicle.color} />
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardHeaderText}>{t.serviceDetails}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      {(iv.mileageIn != null || iv.mileageOut != null) ? (
                        <View style={styles.mileageBox}>
                          {iv.mileageIn != null && (
                            <View style={styles.mileagePill}>
                              <Text style={styles.mileagePillLabel}>{t.mileageIn}</Text>
                              <Text style={styles.mileagePillValue}>
                                {iv.mileageIn.toLocaleString()} {iv.vehicle.mileageUnit}
                              </Text>
                            </View>
                          )}
                          {iv.mileageOut != null && (
                            <View style={styles.mileagePill}>
                              <Text style={styles.mileagePillLabel}>{t.mileageOut}</Text>
                              <Text style={styles.mileagePillValue}>
                                {iv.mileageOut.toLocaleString()} {iv.vehicle.mileageUnit}
                              </Text>
                            </View>
                          )}
                          {mileageDelta != null && mileageDelta >= 0 && (
                            <View style={styles.mileagePill}>
                              <Text style={styles.mileagePillLabel}>{t.mileageTraveled}</Text>
                              <Text style={styles.mileagePillValue}>
                                {mileageDelta.toLocaleString()} {iv.vehicle.mileageUnit}
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.detailValue}>—</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.lineItemsSection}>
                  <View wrap={false}>
                    <Text style={styles.sectionTitle}>{t.colDescription}</Text>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, styles.colDesc]}>{t.colDescription}</Text>
                      <Text style={[styles.tableHeaderCell, styles.colType]}>{t.colType}</Text>
                      <Text style={[styles.tableHeaderCell, styles.colQty]}>{t.colQty}</Text>
                      <Text style={[styles.tableHeaderCell, styles.colPrice]}>{t.colUnitPrice}</Text>
                      <Text style={[styles.tableHeaderCell, styles.colTotal]}>{t.colTotal}</Text>
                    </View>
                  </View>

                  {iv.lineItems.map((item, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tableRow,
                        i % 2 === 1 ? styles.tableRowAlt : {},
                        i === lastIndex ? styles.tableRowLast : {},
                      ]}
                      wrap={false}
                    >
                      <View style={styles.colDesc}>
                        <Text style={styles.tableCellBold}>{item.description}</Text>
                      </View>
                      <View style={styles.colType}>
                        <Text style={styles.tableCell}>
                          {t.itemTypes[item.itemType] ?? item.itemType}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.colQty]}>{fmtQty(item.quantity)}</Text>
                      <Text style={[styles.tableCell, styles.colPrice]}>
                        {fmtCurrency(item.unitPrice, currency)}
                      </Text>
                      <Text style={[styles.tableCellBold, styles.colTotal]}>
                        {fmtCurrency(item.lineTotal, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {warrantyItems.length > 0 && (
            <View style={styles.warrantyCard} wrap={false}>
              <Text style={styles.warrantyTitle}>{t.warrantyDisclosureTitle}</Text>
              <Text style={styles.warrantyIntro}>{t.warrantyDisclosureIntro}</Text>
              {warrantyItems.map((item, i) => (
                <Text key={i} style={styles.warrantyItem}>
                  • {item.description}: {item.warrantyTerm?.trim()}
                </Text>
              ))}
            </View>
          )}

          {/* Mantiene notas + totales juntos (wrap=false); si de verdad no
              caben, bajan enteros a la página siguiente. Sin minPresenceAhead
              para no reservar espacio extra que fuerce un salto innecesario. */}
          <View wrap={false}>
            <View style={styles.bottomRow}>
              {invoice.notes ? (
                <View style={styles.notesCard}>
                  <Text style={styles.notesLabel}>{t.notes}</Text>
                  <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <View style={styles.totalsCard}>
                <View style={styles.totalsHeader}>
                  <Text style={styles.totalsHeaderText}>{currency}</Text>
                </View>
                <View style={styles.totalsBody}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t.subtotal}</Text>
                    <Text style={styles.totalValue}>
                      {fmtCurrency(invoice.subtotal, currency)}
                    </Text>
                  </View>
                  {!suppressTaxes && (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t.tps(tpsPct)}</Text>
                        <Text style={styles.totalValue}>
                          {fmtCurrency(tpsAmount.toString(), currency)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t.tvq(tvqPct)}</Text>
                        <Text style={styles.totalValue}>
                          {fmtCurrency(tvqAmount.toString(), currency)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: SLATE_400 }]}>
                          {t.taxesTotal}
                        </Text>
                        <Text style={styles.totalValue}>
                          {fmtCurrency(taxAmount.toString(), currency)}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={styles.totalDivider} />
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>{t.grandTotal}</Text>
                  <Text style={styles.grandTotalValue}>
                    {fmtCurrency(
                      suppressTaxes ? invoice.subtotal : invoice.total,
                      currency
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <InvoiceFooter invoice={invoice} t={t} />
      </Page>
    </Document>
  );
}
