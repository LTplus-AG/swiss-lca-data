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
    // Expose first API key for client-side read operations
    NEXT_PUBLIC_API_KEY: process.env.API_KEYS?.split(',')[0] || '',
  },
};

export default nextConfig;
