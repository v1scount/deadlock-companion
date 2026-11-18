import type { NextConfig } from "next";
import { hostname } from "node:os";

const nextConfig: NextConfig = {
  // Self-contained server for the Electron installer (local Next + API routes).
  output: "standalone",
  // Dev-only: allow opening the app via this machine's peer/LAN name
  // (e.g. NetBird `cachy-home:3000`). Ignored by `next start` / production.
  allowedDevOrigins: [hostname()],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets-bucket.deadlock-api.com",
      },
      {
        protocol: "https",
        hostname: "cdn.deadlock-api.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
