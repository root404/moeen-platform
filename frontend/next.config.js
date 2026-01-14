/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable internationalization for Arabic
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en'],
  },

  // Enable App Router
  experimental: {
    appDir: true,
  },
  
  // React Strict Mode
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;