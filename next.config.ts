import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/badge/:productId.svg",
        destination: "/api/badge/:productId",
      },
    ];
  },
};

export default nextConfig;
