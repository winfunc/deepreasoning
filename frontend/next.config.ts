import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Changed from 'standalone' to 'export'
  distDir: 'dist',   // This will output to './dist' instead of '.next'
  images: {
    unoptimized: true, // Required for 'export'
  }
}

export default nextConfig;