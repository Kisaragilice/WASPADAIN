import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating Next.js dev indicator sits over the mobile bottom navigation
  // and intercepts taps in development. Keep the error overlay, drop the badge.
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
