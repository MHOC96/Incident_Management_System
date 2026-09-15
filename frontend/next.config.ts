import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const backend = (process.env.API_PROXY_URL ?? "http://127.0.0.1:8000/api").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${backend}/:path*/` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "same-origin" },
    ] }];
  },
};

export default nextConfig;
