/** @type {import('next').NextConfig} */
const nextConfig = {
  // הגדרת תיקיית הפלט ל-.next (ברירת המחדל של Next.js)
  distDir: '.next',
  // הגדרות נוספות
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // הגדרות עבור פריסה בסביבת Vercel
  output: 'standalone',
};

export default nextConfig;
