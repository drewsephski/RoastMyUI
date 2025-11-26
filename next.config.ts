import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, { '@sparticuz/chromium': 'commonjs @sparticuz/chromium' }];
    }
    return config;
  },
};

export default nextConfig;
