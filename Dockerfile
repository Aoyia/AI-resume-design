FROM docker.m.daocloud.io/library/node:18-slim

# 安装 Chromium 依赖以及文泉驿微米黑字体（支持中文 PDF 渲染）
# 兼容 Debian 11 和 12，安全地使用阿里云镜像源加速 apt 安装
RUN if [ -f /etc/apt/sources.list ]; then \
        sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list && \
        sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list; \
    fi && \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
        sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources; \
    fi

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
# 使用淘宝 npm 镜像源加速依赖安装
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

# 复制其余源码
COPY . .

# 执行生产打包
RUN npm run build

# 暴露 3000 端口
EXPOSE 3000

# 运行服务
CMD ["npm", "run", "start"]
