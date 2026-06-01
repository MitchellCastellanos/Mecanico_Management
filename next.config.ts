import type { NextConfig } from "next";
import { BRAND } from "./src/config/brand";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "googleapis", "canvas"],

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
    return BRAND.legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${BRAND.appUrl}/:path*`,
      permanent: true,
    }));
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
