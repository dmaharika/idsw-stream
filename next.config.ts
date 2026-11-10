import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
    }];
  },
};

export default nextConfig;
