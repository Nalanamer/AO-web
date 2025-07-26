import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Force dynamic rendering by preventing static optimization
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  }
};

export default nextConfig;