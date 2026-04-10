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

  // Ignorar errores de TypeScript para build (solo para demo)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
