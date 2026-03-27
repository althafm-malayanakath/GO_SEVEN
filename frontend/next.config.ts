import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'go-seven-backend.vercel.app' },
      { protocol: 'http', hostname: 'go-seven-backend.vercel.app' },
    ],
  },
};

export default nextConfig;
