import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Fix for NextRouter not mounted errors during build
  output: 'export',
  trailingSlash: true,
  
  // Required for static export
  images: {
    unoptimized: true
  },
  
  // Disable ISR to prevent router issues
  experimental: {
    esmExternals: 'loose'
  },
  
  // Ensure proper static generation
  distDir: '.next',
  
  // Handle dynamic routes properly
  async generateBuildId() {
    return 'build-' + new Date().getTime()
  }
};

export default nextConfig;
