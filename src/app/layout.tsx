import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/config/brand";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.appUrl),
  title: {
    default: BRAND.shopName,
    template: `%s · ${BRAND.shopName}`,
  },
  description: "Taller mecánico en Montréal — Garage Carlos A Inc.",
  alternates: {
    canonical: BRAND.appUrl,
  },
  openGraph: {
    title: BRAND.shopName,
    description: "Taller mecánico en Montréal",
    url: BRAND.appUrl,
    siteName: BRAND.shopName,
    locale: "es_CA",
    type: "website",
    images: [{ url: BRAND.logoPath, width: 347, height: 329, alt: BRAND.shopName }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.shopName,
    description: "Taller mecánico en Montréal",
    images: [BRAND.logoPath],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full ${oswald.variable}`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
