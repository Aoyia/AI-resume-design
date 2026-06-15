FROM node:18-slim

# 安装 Chromium 依赖以及文泉驿微米黑字体（支持中文 PDF 渲染）
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-wqy-zenhei \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 设置环境变量，告知 Puppeteer 跳过内置下载并使用系统安装的 Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 复制依赖定义并利用 Docker 缓存
COPY package*.json ./
RUN npm ci

# 复制其余源码
COPY . .

# 执行生产打包
RUN npm run build

# 暴露 3000 端口
EXPOSE 3000

# 运行服务
CMD ["npm", "run", "start"]
