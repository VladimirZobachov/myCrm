import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-сборка для Docker (минимальный образ)
  output: "standalone",
  // Turbopack требует новый GLIBC — используем webpack
  turbopack: undefined,
  webpack: (config) => config,
};

export default nextConfig;
