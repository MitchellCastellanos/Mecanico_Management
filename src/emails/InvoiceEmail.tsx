// Template de email para enviar la factura al cliente.
// Usa @react-email/components — se renderiza en el servidor con Resend.
// El idioma sigue al de la factura (invoice.language) → i18n ES/EN/FR.
// El PDF de la factura va como adjunto (ver sendInvoiceEmail en lib/email.ts).

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";
import {
  getInvoiceEmailStrings,
  getInvoiceStrings,
  type InvoiceLanguage,
} from "@/lib/invoice-i18n";

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueAt?: Date | null;
  status: string;
  language?: InvoiceLanguage | string | null;
  shopName: string;
  shopEmail?: string | null;
  shopPhone?: string | null;
}

export function InvoiceEmail({
  clientName,
  invoiceNumber,
  totalFormatted,
  dueAt,
  status,
  language,
  shopName,
  shopEmail,
  shopPhone,
}: InvoiceEmailProps) {
  const t = getInvoiceEmailStrings(language);
  const inv = getInvoiceStrings(language);
  const isPaid = status === "PAID";
  const statusLabel = inv.statuses[status] ?? status;

  function fmtDue(d: Date): string {
    const date = new Date(d);
    return `${date.getDate()} ${inv.months[date.getMonth()]} ${date.getFullYear()}`;
  }

  return (
    <Html lang={t.htmlLang}>
      <Head />
      <Preview>{t.preview(invoiceNumber)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.shopName}>{shopName}</Heading>
            <Text style={styles.headerSubtitle}>{t.heading}</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>{t.greeting(clientName)}</Text>
            <Text style={styles.body_text}>
              {isPaid ? t.paidIntro(shopName) : t.intro(shopName)}
            </Text>

            {/* Resumen */}
            <Section style={styles.card}>
              <Text style={styles.cardLabel}>{t.invoiceNo.toUpperCase()}</Text>
              <Text style={styles.cardValue}>{invoiceNumber}</Text>

              <Hr style={styles.cardDivider} />

              <Text style={styles.cardLabel}>{t.totalLabel.toUpperCase()}</Text>
              <Text style={styles.cardTotal}>{totalFormatted}</Text>

              {dueAt && (
                <>
                  <Hr style={styles.cardDivider} />
                  <Text style={styles.cardLabel}>{t.dueLabel.toUpperCase()}</Text>
                  <Text style={styles.cardValue}>{fmtDue(dueAt)}</Text>
                </>
              )}

              <Hr style={styles.cardDivider} />
              <Text style={styles.cardLabel}>{t.statusLabel.toUpperCase()}</Text>
              <Text
                style={{
                  ...styles.statusBadge,
                  ...(isPaid ? styles.statusPaid : styles.statusPending),
                }}
              >
                {statusLabel}
              </Text>
            </Section>

            <Text style={styles.attachmentNote}>{t.attachmentNote}</Text>
            <Text style={styles.body_text}>{t.questions}</Text>

            {/* Contact */}
            {(shopPhone || shopEmail) && (
              <Section style={styles.contact}>
                <Text style={styles.contactShop}>{shopName}</Text>
                {shopPhone && (
                  <Text style={styles.contactDetail}>📞 {shopPhone}</Text>
                )}
                {shopEmail && (
                  <Text style={styles.contactDetail}>✉️ {shopEmail}</Text>
                )}
              </Section>
            )}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{t.footer(shopName)}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "20px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    maxWidth: "560px",
    margin: "0 auto",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#1d4ed8",
    padding: "32px 40px",
  },
  shopName: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  headerSubtitle: {
    color: "#bfdbfe",
    fontSize: "13px",
    margin: "0",
  },
  content: {
    padding: "32px 40px",
  },
  greeting: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 12px 0",
  },
  body_text: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    margin: "0 0 24px 0",
  },
  cardLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.8px",
    margin: "0 0 4px 0",
  },
  cardValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
  },
  cardTotal: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1d4ed8",
    margin: "0",
  },
  cardDivider: {
    borderColor: "#e2e8f0",
    margin: "16px 0",
  },
  statusBadge: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "700",
    borderRadius: "999px",
    padding: "4px 12px",
    margin: "0",
  },
  statusPaid: {
    backgroundColor: "#d1fae5",
    color: "#059669",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },
  attachmentNote: {
    fontSize: "13px",
    color: "#1d4ed8",
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "0 0 20px 0",
  },
  contact: {
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  contactShop: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1d4ed8",
    margin: "0 0 6px 0",
  },
  contactDetail: {
    fontSize: "13px",
    color: "#475569",
    margin: "2px 0",
  },
  footer: {
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "20px 40px",
  },
  footerText: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: "0",
    textAlign: "center" as const,
  },
};
