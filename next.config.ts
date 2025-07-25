import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
<<<<<<< HEAD
  // Basic config for Appwrite Sites
  output: 'export',
  trailingSlash: true,
=======
  // Fix for NextRouter not mounted errors during build
  output: 'export',
  trailingSlash: true,
  
  // Required for static export
>>>>>>> 727113d342e998d2655b95a84e0a79d7a142a161
  images: {
    unoptimized: true
  },
  
<<<<<<< HEAD
  // Skip pre-rendering problematic pages
  async exportPathMap() {
    return {
      '/': { page: '/' },
      '/feed': { page: '/feed' },
      '/profile': { page: '/profile' },
      '/billing': { page: '/billing' },
      '/chat': { page: '/chat' }
    };
=======
  // Disable ISR to prevent router issues
  experimental: {
    esmExternals: 'loose'
  },
  
  // Ensure proper static generation
  distDir: '.next',
  
  // Handle dynamic routes properly
  async generateBuildId() {
    return 'build-' + new Date().getTime()
>>>>>>> 727113d342e998d2655b95a84e0a79d7a142a161
  }
};

export default nextConfig;