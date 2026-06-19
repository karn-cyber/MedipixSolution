import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Mongoose must run on the Node runtime, not be bundled by webpack/turbopack.
  serverExternalPackages: ["mongoose", "@mongodb-js/zstd", "snappy", "kerberos"],
  experimental: {
    // Invoice photos are sent through a Server Action; the default 1MB cap is
    // too small for camera images, which surfaced as a generic render error.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
