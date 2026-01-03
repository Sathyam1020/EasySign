/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to silence warning
  turbopack: {},
  webpack: (config: any) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;