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

export type AppointmentEmailType = "confirmation" | "reminder" | "cancellation";

export interface AppointmentEmailProps {
  type: AppointmentEmailType;
  clientName: string;
  shopName: string;
  title: string;
  startsAtFormatted: string;
  shopPhone?: string | null;
  shopEmail?: string | null;
}

const COPY: Record<
  AppointmentEmailType,
  { preview: (title: string, shop: string) => string; heading: string; body: string }
> = {
  confirmation: {
    preview: (title, shop) => `Cita confirmada: ${title} — ${shop}`,
    heading: "Cita confirmada",
    body: "Tu cita ha sido registrada. Te esperamos en la fecha y hora indicadas.",
  },
  reminder: {
    preview: (title, shop) => `Recordatorio de cita: ${title} — ${shop}`,
    heading: "Recordatorio de cita",
    body: "Te recordamos que tienes una cita próxima en nuestro taller.",
  },
  cancellation: {
    preview: (title, shop) => `Cita cancelada: ${title} — ${shop}`,
    heading: "Cita cancelada",
    body: "Tu cita ha sido cancelada. Si deseas reprogramar, contáctanos.",
  },
};

export function AppointmentEmail({
  type,
  clientName,
  shopName,
  title,
  startsAtFormatted,
  shopPhone,
  shopEmail,
}: AppointmentEmailProps) {
  const copy = COPY[type];

  return (
    <Html lang="es">
      <Head />
      <Preview>{copy.preview(title, shopName)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.shopName}>{shopName}</Heading>
            <Text style={styles.headerSubtitle}>{copy.heading}</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hola, {clientName}</Text>
            <Text style={styles.bodyText}>{copy.body}</Text>

            <Section style={styles.card}>
              <Text style={styles.cardLabel}>SERVICIO</Text>
              <Text style={styles.cardValue}>{title}</Text>

              <Hr style={styles.cardDivider} />

              <Text style={styles.cardLabel}>FECHA Y HORA</Text>
              <Text style={styles.cardValue}>{startsAtFormatted}</Text>
            </Section>

            <Text style={styles.bodyText}>
              Para cambios o consultas, contáctanos:
            </Text>
            {shopPhone && <Text style={styles.contactDetail}>{shopPhone}</Text>}
            {shopEmail && <Text style={styles.contactDetail}>{shopEmail}</Text>}
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Este correo fue enviado por {shopName}.
            </Text>
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
    backgroundColor: "#0f766e",
    padding: "28px 40px",
  },
  shopName: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  headerSubtitle: {
    color: "#99f6e4",
    fontSize: "14px",
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
  bodyText: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  },
  card: {
    backgroundColor: "#f0fdfa",
    borderRadius: "8px",
    border: "1px solid #99f6e4",
    padding: "20px 24px",
    margin: "0 0 24px 0",
  },
  cardLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#0d9488",
    letterSpacing: "0.8px",
    margin: "0 0 4px 0",
  },
  cardValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0",
  },
  cardDivider: {
    borderColor: "#ccfbf1",
    margin: "16px 0",
  },
  contactDetail: {
    fontSize: "14px",
    color: "#0f766e",
    fontWeight: "600",
    margin: "4px 0",
  },
  footer: {
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "20px 40px",
  },
  footerText: {
    fontSize: "11px",
    color: "#94a3b8",
    textAlign: "center" as const,
    margin: "0",
  },
};
