import type { NextConfig } from 'next';
import * as dotenv from "dotenv";
dotenv.config();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
  output: "standalone",
};

export default nextConfig;
