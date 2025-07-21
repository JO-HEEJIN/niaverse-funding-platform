/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // 환경 변수를 서버 사이드에서 사용할 수 있도록 설정
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE,
  },
  // Amplify에서 환경 변수를 읽을 수 있도록 serverRuntimeConfig 추가
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

module.exports = nextConfig;