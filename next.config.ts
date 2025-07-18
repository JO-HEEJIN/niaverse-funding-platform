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
  images: {
    unoptimized: true,
  },
  // API routes를 위해 제거
  // trailingSlash: true,
  // output: 'standalone',
};

export default nextConfig;
