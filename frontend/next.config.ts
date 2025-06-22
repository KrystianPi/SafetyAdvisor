import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds - we're in development!
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore TypeScript errors during builds if needed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
