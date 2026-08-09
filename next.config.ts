import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const target = backendHost.endsWith("/") ? backendHost.slice(0, -1) : backendHost;
      return [
        {
          source: "/api/:path*",
          destination: `${target}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
