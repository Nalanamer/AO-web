import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Remove static export - use SSR instead
  // output: 'export', ← Remove this line
  
  // Allow dynamic imports and routing
  images: {
    domains: ['cloud.appwrite.io'],
    unoptimized: false
  }
};

export default nextConfig;