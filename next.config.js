/** @type {import('next').NextConfig} */
const nextConfig = {
  // next-auth v5 uses jose (ESM-only). Exclude from server bundle so Node resolves them at runtime.
  serverExternalPackages: ["jose", "@auth/core", "next-auth", "@auth/prisma-adapter"],
};

module.exports = nextConfig;
