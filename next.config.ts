import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Force dynamic rendering for all pages to avoid router errors
  async generateStaticParams() {
    return [];
  }
};

export default nextConfig;