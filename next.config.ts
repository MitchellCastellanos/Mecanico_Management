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
      // Los bots que generan vistas previas de links (WhatsApp, Facebook, X,
      // Slack, Discord, iMessage, buscadores…) no siguen bien redirects para
      // leer metadatos OG — si el user-agent coincide con uno conocido, se
      // sirve "/" tal cual (ver src/app/page.tsx) en vez de redirigir, para
      // que el link corto muestre un preview enriquecido.
      missing: [
        {
          type: "header" as const,
          key: "user-agent",
          // Next ancla este valor como ^valor$ (matchHas en
          // prepare-destination.js), así que hace falta .* a los lados para
          // que actúe como "contiene", no como igualdad exacta.
          value:
            ".*(facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterest|redditbot|Applebot|Googlebot|bingbot|DuckDuckBot|YandexBot|vkShare|Iframely|W3C_Validator|Bytespider|ia_archiver).*",
        },
      ],
    };

    return [...legacyHostRedirects, rootRedirect, ...legacyAppRoots, ...legacyAppPaths];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
