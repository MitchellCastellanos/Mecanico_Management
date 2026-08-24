import type { NextConfig } from "next";
import { BRAND, bookingPublicPath } from "./src/config/brand";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "googleapis", "canvas", "sharp", "pdf-lib"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  async redirects() {
    const legacyHostRedirects = BRAND.legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${BRAND.appUrl}/:path*`,
      permanent: true,
    }));

    const legacyAppPaths = [
      "/login",
      "/dashboard",
      "/clients",
      "/invoices",
      "/quotes",
      "/appointments",
      "/reminders",
      "/accounting",
      "/caja",
      "/settings",
      "/vehicles",
    ].map((path) => ({
      source: `${path}/:path*`,
      destination: `/admin${path}/:path*`,
      permanent: true,
    }));

    const legacyAppRoots = legacyAppPaths.map((p) => ({
      source: p.source.replace("/:path*", ""),
      destination: p.destination.replace("/:path*", ""),
      permanent: true,
    }));

    const rootRedirect = {
      source: "/",
      destination: bookingPublicPath(),
      permanent: false,
    };

    return [...legacyHostRedirects, rootRedirect, ...legacyAppRoots, ...legacyAppPaths];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
