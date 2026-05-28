// PDF Template — @react-pdf/renderer

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatClientName } from "@/lib/client-name";
import { calculateTaxBreakdown, TPS_RATE, TVQ_RATE } from "@/lib/taxes";
import { getInvoiceStrings, type InvoiceLanguage } from "@/lib/invoice-i18n";
import Decimal from "decimal.js";

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
  language?: InvoiceLanguage | string | null;
  notes?: string | null;
  lineItems: LineItem[];
  client: {
    firstName: string;
    lastName?: string | null;
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
    vin?: string | null;
    color?: string | null;
  };
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

const LOGO_WIDTH = 168;
const LOGO_HEIGHT = 88;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: SLATE_900,
    backgroundColor: WHITE,
    paddingBottom: 72,
  },
  topBar: {
    height: 6,
    backgroundColor: BLUE,
  },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    flex: 1,
    maxWidth: 360,
  },
  logoBox: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    backgroundColor: WHITE,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: LOGO_WIDTH - 20,
    height: LOGO_HEIGHT - 20,
    objectFit: "contain",
  },
  logoPlaceholder: {
    width: LOGO_WIDTH - 20,
    height: LOGO_HEIGHT - 20,
    backgroundColor: SLATE_100,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholderText: {
    fontSize: 7,
    color: SLATE_400,
    textAlign: "center",
  },
  shopName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 8,
  },
  shopContact: {
    fontSize: 8.5,
    color: "#cbd5e1",
    lineHeight: 1.55,
  },
  invoicePanel: {
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 200,
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 3,
    gap: 12,
  },
  metaLabel: { fontSize: 8, color: SLATE_600, flex: 1 },
  metaValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: SLATE_900, textAlign: "right" },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  body: {
    paddingHorizontal: 40,
    paddingTop: 22,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cardHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 5,
    gap: 6,
  },
  detailLabel: {
    fontSize: 8,
    color: SLATE_400,
    width: 58,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 8.5,
    color: SLATE_700,
    flex: 1,
    lineHeight: 1.4,
  },
  mileageBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  mileagePill: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mileagePillLabel: { fontSize: 7, color: BLUE, fontFamily: "Helvetica-Bold" },
  mileagePillValue: { fontSize: 8, color: NAVY, marginTop: 1 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_600,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  tableRowAlt: { backgroundColor: SLATE_50 },
  tableCell: { fontSize: 9, color: SLATE_600 },
  tableCellBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: SLATE_900 },
  colDesc: { flex: 4 },
  colType: { flex: 1.4 },
  colQty: { flex: 0.9, textAlign: "right" },
  colPrice: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },
  bottomRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  notesCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  notesText: { fontSize: 9, color: SLATE_600, lineHeight: 1.55 },
  totalsCard: {
    width: 248,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 8,
    overflow: "hidden",
  },
  totalsHeader: {
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  totalsHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_600,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalsBody: { paddingHorizontal: 14, paddingVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 9, color: SLATE_600 },
  totalValue: { fontSize: 9, color: SLATE_900 },
  totalDivider: {
    height: 1,
    backgroundColor: SLATE_200,
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: SLATE_200,
    backgroundColor: SLATE_50,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  footerThank: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    marginBottom: 4,
  },
  footerMeta: {
    fontSize: 7.5,
    color: SLATE_400,
    textAlign: "center",
    lineHeight: 1.5,
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
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const t = getInvoiceStrings(invoice.language);
  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.DRAFT;
  const statusLabel = t.statuses[invoice.status] ?? invoice.status;
  const currency = invoice.shop.currency ?? "CAD";

  const { tpsAmount, tvqAmount, taxAmount } = calculateTaxBreakdown(
    invoice.subtotal,
    invoice.taxRate
  );
  const factor = new Decimal(invoice.taxRate).div(TPS_RATE + TVQ_RATE);
  const tpsPct = new Decimal(TPS_RATE).times(factor).times(100).toFixed(2);
  const tvqPct = new Decimal(TVQ_RATE).times(factor).times(100).toFixed(2);

  const mileageDelta =
    invoice.mileageIn != null && invoice.mileageOut != null
      ? invoice.mileageOut - invoice.mileageIn
      : null;

  return (
    <Document title={t.documentTitle(invoice.invoiceNumber)} author={invoice.shop.name}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.topBar} />

        {/* Header con logo grande */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              {invoice.shop.logoUrl ? (
                <Image src={invoice.shop.logoUrl} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>{invoice.shop.name}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>{invoice.shop.name}</Text>
              <Text style={styles.shopContact}>
                {[
                  invoice.shop.phone && `${t.phone}: ${invoice.shop.phone}`,
                  invoice.shop.email && `${t.email}: ${invoice.shop.email}`,
                  invoice.shop.address && `${t.address}: ${invoice.shop.address}`,
                  invoice.shop.taxId && `${t.taxRegistration}: ${invoice.shop.taxId}`,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </Text>
            </View>
          </View>

          <View style={styles.invoicePanel}>
            <Text style={styles.invoiceTitle}>{t.invoiceTitle}</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.date}</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issuedAt, t.months)}</Text>
            </View>
            {invoice.dueAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t.due}</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.dueAt, t.months)}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t.status}</Text>
              <Text style={styles.metaValue}>{statusLabel}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.color }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Tarjetas: cliente, vehículo, kilometraje */}
          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>{t.billTo}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{formatClientName(invoice.client)}</Text>
                <DetailRow label={t.email} value={invoice.client.email} />
                <DetailRow label={t.phone} value={invoice.client.phone} />
                <DetailRow label={t.address} value={invoice.client.address} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>{t.vehicle}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                </Text>
                <DetailRow label={t.plate} value={invoice.vehicle.licensePlate} />
                <DetailRow label={t.vin} value={invoice.vehicle.vin} />
                <DetailRow label={t.color} value={invoice.vehicle.color} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>{t.serviceDetails}</Text>
              </View>
              <View style={styles.cardBody}>
                {(invoice.mileageIn != null || invoice.mileageOut != null) && (
                  <View style={styles.mileageBox}>
                    {invoice.mileageIn != null && (
                      <View style={styles.mileagePill}>
                        <Text style={styles.mileagePillLabel}>{t.mileageIn}</Text>
                        <Text style={styles.mileagePillValue}>
                          {invoice.mileageIn.toLocaleString()} {invoice.vehicle.mileageUnit}
                        </Text>
                      </View>
                    )}
                    {invoice.mileageOut != null && (
                      <View style={styles.mileagePill}>
                        <Text style={styles.mileagePillLabel}>{t.mileageOut}</Text>
                        <Text style={styles.mileagePillValue}>
                          {invoice.mileageOut.toLocaleString()} {invoice.vehicle.mileageUnit}
                        </Text>
                      </View>
                    )}
                    {mileageDelta != null && mileageDelta >= 0 && (
                      <View style={styles.mileagePill}>
                        <Text style={styles.mileagePillLabel}>{t.mileageTraveled}</Text>
                        <Text style={styles.mileagePillValue}>
                          {mileageDelta.toLocaleString()} {invoice.vehicle.mileageUnit}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {!invoice.mileageIn && !invoice.mileageOut && (
                  <Text style={styles.detailValue}>—</Text>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t.colDescription}</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>{t.colDescription}</Text>
              <Text style={[styles.tableHeaderCell, styles.colType]}>{t.colType}</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>{t.colQty}</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>{t.colUnitPrice}</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>{t.colTotal}</Text>
            </View>

            {invoice.lineItems.map((item, i) => (
              <View
                key={i}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCellBold, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colType]}>
                  {t.itemTypes[item.itemType] ?? item.itemType}
                </Text>
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
                  <Text style={[styles.totalLabel, { color: SLATE_400 }]}>{t.taxesTotal}</Text>
                  <Text style={styles.totalValue}>
                    {fmtCurrency(taxAmount.toString(), currency)}
                  </Text>
                </View>
                <View style={styles.totalDivider} />
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>{t.grandTotal}</Text>
                <Text style={styles.grandTotalValue}>
                  {fmtCurrency(invoice.total, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerThank}>{t.thankYou}</Text>
          <Text style={styles.footerMeta}>
            {invoice.shop.name}
            {invoice.shop.phone ? ` · ${invoice.shop.phone}` : ""}
            {invoice.shop.email ? ` · ${invoice.shop.email}` : ""}
            {invoice.shop.taxId ? `\n${invoice.shop.taxId}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
