import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // Add this line to silence the Turbopack warning
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  experimental: {
    // @ts-expect-error: outputFileTracingIncludes is valid for Vercel but might be missing from types
    outputFileTracingIncludes: {
      '/api/roast': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, { '@sparticuz/chromium': 'commonjs @sparticuz/chromium' }];
    }
    return config;
  },
};

export default nextConfig;
