import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AWS Amplify 배포를 위한 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Amplify 호환성을 위한 설정
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'standalone',
};

export default nextConfig;
