import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Configurar el directorio raíz para evitar warnings sobre múltiples lockfiles
  experimental: {
    turbo: {
      root: path.join(__dirname),
    },
  },
};

export default nextConfig;
