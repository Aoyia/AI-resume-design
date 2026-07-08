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
      // 生产环境构建时禁用缓存，防止与后台运行 of dev 进程持久缓存目录冲突导致损坏
      config.cache = false;
    } else {
      // 开发模式下忽略对简历模板物理文件的热更新监控，规避数据打字同步写入落盘时触发 HMR 重新编译引发的页面折叠与连接死锁
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: ['**/node_modules/**', '**/src/data/defaultResume.json']
      };
    }
    return config;
  },
};

module.exports = nextConfig;
