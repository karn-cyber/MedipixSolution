import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Mongoose must run on the Node runtime, not be bundled by webpack/turbopack.
  serverExternalPackages: ["mongoose", "@mongodb-js/zstd", "snappy", "kerberos"],
};

export default nextConfig;
