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
  // There's also a Clerk warning about Edge Runtime
  experimental: {
    // This should help with the Clerk Edge Runtime warning
    serverComponentsExternalPackages: ["@clerk/backend"],
  },
};

export default nextConfig;
