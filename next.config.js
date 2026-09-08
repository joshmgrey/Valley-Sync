/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Prisma driver adapter out of the webpack bundle — bundling it
  // breaks one of its Error subclasses ("Must call super constructor"), which
  // then masks real query errors.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

module.exports = nextConfig;
