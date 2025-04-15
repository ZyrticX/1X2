/** @type {import('next').NextConfig} */
const nextConfig = {
  // הגדרת תיקיית הפלט ל-build במקום .next
  distDir: 'build',
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
