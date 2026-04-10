import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite imágenes desde Supabase Storage y Google
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
};

export default nextConfig;
