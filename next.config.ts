import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Basic config for Appwrite Sites
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Skip pre-rendering problematic pages
  async exportPathMap() {
    return {
      '/': { page: '/' },
      '/feed': { page: '/feed' },
      '/profile': { page: '/profile' },
      '/billing': { page: '/billing' },
      '/chat': { page: '/chat' }
    };
  }
};

export default nextConfig;