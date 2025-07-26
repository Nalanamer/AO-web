import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Disable static page generation completely
  trailingSlash: true,
  async exportPathMap() {
    return {};
  }
};

export default nextConfig;