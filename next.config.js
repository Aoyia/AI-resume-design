/** @type {import('next').NextConfig} */
const nextConfig = {
  // Puppeteer 只在 Node.js 环境运行，排除在 bundle 之外
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      // 生产环境构建时禁用缓存，防止与后台运行的 dev 进程持久缓存目录冲突导致损坏
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
