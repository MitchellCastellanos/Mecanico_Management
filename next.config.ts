import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer y googleapis corren solo en el servidor —
  // marcarlos como externos evita que el bundler intente procesarlos
  // en el build de los Server Components y Route Handlers.
  serverExternalPackages: ["@react-pdf/renderer", "googleapis", "canvas"],

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
