import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.appUrl),
  title: {
    default: BRAND.shopName,
    template: `%s · ${BRAND.shopName}`,
  },
  description: "Sistema de gestión para taller mecánico",
  alternates: {
    canonical: BRAND.appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
