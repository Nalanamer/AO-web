import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async exportPathMap() {
    return {
      '/': { page: '/' }
    };
  }
};

export default nextConfig;