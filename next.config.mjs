/** @type {import('next').NextConfig} */
const nextConfig = {
  // הגדרת תיקיית הפלט ל-build
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
  // הוספת הגדרות ניתוב
  trailingSlash: false,
  // הגדרות בסיסיות
  basePath: '',
  // הגדרות אסטרטגיית בנייה
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
