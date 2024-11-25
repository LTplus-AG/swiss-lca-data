import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This will completely ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This will ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@clerk/backend"],
  env: {
    API_KEYS: process.env.API_KEYS,
  },
};

export default nextConfig;
