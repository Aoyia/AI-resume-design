const isExport = process.env.EXPORT_STATIC === 'true';
const repoName = 'AI-resume-design'; // GitHub 仓库名

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 仅在明确指示导出静态时启用
  output: isExport ? 'export' : undefined,
  // 仅在静态模式下适配 GitHub Pages 路径
  basePath: isExport ? `/${repoName}` : '',
  assetPrefix: isExport ? `/${repoName}/` : '',

  // 禁用字体优化以防在没有稳定外网连接时构建失败
  optimizeFonts: false,

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
