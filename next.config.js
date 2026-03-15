/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA config would go here with next-pwa package
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
