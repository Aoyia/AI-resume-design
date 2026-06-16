---
title: 在阿里云 ECS 上通过 Docker 部署集成了 Puppeteer PDF 导出的 Next.js 应用踩坑实录
date: 2026-06-16
tags: [Next.js, Docker, Puppeteer, Nginx, 部署, 阿里云]
---

# 在阿里云 ECS 上通过 Docker 部署集成了 Puppeteer PDF 导出的 Next.js 应用踩坑实录

在现代化 Web 开发中，基于 React/Next.js 构建简历工具、报表系统等应用时，**导出 PDF** 往往是一项核心需求。我们通常会在后端通过 Puppeteer 启动一个 Headless（无头）Chromium 浏览器，将动态渲染的 HTML 简历导出为高清 PDF 格式。

然而，将这类集成了浏览器内核的 Next.js 应用部署到国内云服务器（如阿里云 ECS）时，由于特殊的网络环境、操作系统环境以及字体库的缺失，往往会面临极大的挑战。

本文将真实还原我们在阿里云 Debian/CentOS 服务器上，通过 **Docker + Puppeteer + Nginx** 部署该应用的完整过程，并梳理在构建镜像、依赖安装、Nginx 反代及自动化部署中踩过的“深坑”与解决方案。

---

## 🛠 部署架构设计

本项目的整体服务拓扑如下：

1. **宿主机 Nginx 反向代理**：监听在 `8080` 端口（避免与 80 端口上的现有文档系统冲突），将公网流量安全地转发到容器内部。
2. **Next.js Docker 容器**：运行在独立的隔离网桥上，映射至本地的 `127.0.0.1:3000`。
3. **Puppeteer + Chromium 引擎**：打包在 Node 镜像内部，由 Nest.js/Next.js API 路由直接调起系统级 Chromium 进行后台 PDF 打印。

---

## 🚨 五大核心踩坑与加速实践

### 坑 1：国内网络环境拉取 Node 基础镜像超时

在阿里云 ECS 上直接执行 `docker build` 时，Dockerfile 的第一步 `FROM node:18-slim` 经常会因为连接官方 Docker Hub 慢而导致 `DeadlineExceeded` 构建超时。

* **解决方案**：
  我们改用 DaoCloud 提供的国内加速镜像源。在 Dockerfile 开头采用：
  ```dockerfile
  FROM docker.m.daocloud.io/library/node:18-slim
  ```

---

### 坑 2：Debian 镜像源更新失败与 Debian 12 软件源路径变更

在 `node:18-slim` 基础镜像中，为了运行 Puppeteer，我们需要安装 Chromium 和中文字体包。然而，Debian 官方的软件源下载极慢，直接 `apt-get update` 大概率失败。

* **更关键的“新坑”**：
  新版 Debian 12 基础镜像中不含传统的 `/etc/apt/sources.list`，软件源移至了 `/etc/apt/sources.list.d/debian.sources`。如果直接像以前一样用 `sed` 替换 `/etc/apt/sources.list` 会失效。
* **解决方案**：
  在 Dockerfile 中加入 shell 路径判断逻辑，动态加速 APT 源为阿里云镜像站：
  ```dockerfile
  RUN if [ -f /etc/apt/sources.list ]; then \
          sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list && \
          sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list; \
      fi && \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
          sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
          sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources; \
      fi
  ```

---

### 坑 3：无字体支持导致 PDF 中文全部乱码（方块）

由于 Linux 基础镜像（如 Debian Slim）默认只包含基础西文字体，当 Puppeteer 打开网页渲染中文简历时，所有的汉字都会变成无法识别的方块。

* **解决方案**：
  在 Dockerfile 中利用加速后的 Apt 源安装 **`fonts-wqy-zenhei`**（文泉驿微米黑中文字体）和系统级 `chromium` 浏览器。
  ```dockerfile
  RUN apt-get update && apt-get install -y \
      chromium \
      fonts-wqy-zenhei \
      --no-install-recommends \
      && rm -rf /var/lib/apt/lists/*
  ```
  并在 Docker 环境变量中，明确跳过 Puppeteer 默认 the 内置 Chromium 下载，将执行路径指定为宿主机系统 Chromium 的默认路径：
  ```dockerfile
  ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
  ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
  ```

---

### 坑 4：Next.js 代码中 Puppeteer 路径的硬编码

如果我们在前端 API 路由中直接采用默认的 `puppeteer.launch()`，可能会因为找不到沙箱环境需要的参数或 Chromium 可执行程序路径而报错。

* **解决方案**：
  修改 Next.js 后端路由代码（例如 `src/app/api/pdf/route.ts`），支持通过 `PUPPETEER_EXECUTABLE_PATH` 环境变量指定可执行路径，并且加上 `--no-sandbox` 避免 Linux 权限报错。
  ```typescript
  browser = await puppeteer.default.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  ```

---

### 坑 5：Nginx 配置文件上传时的变量转义导致服务报错

在通过本地自动化部署脚本（例如使用 SSH 远程输入多行 EOF）写入 `/etc/nginx/conf.d/resume.conf` 时，如果误在本地使用双引号包裹 Shell 命令，会导致 Nginx 内置的变量如 `$http_upgrade`、`$host` 被本地 Shell 提前解析为空白，造成 Nginx 语法报错崩溃。

* **解决方案**：
  不要直接在 SSH 命令里执行长字符串 `cat << EOF`。更好的实践是在本地直接写好配置文件，使用干净的 **`SCP / SFTP`** 将文件独立上传，然后再执行远程的 `nginx -t && systemctl reload nginx`。

---

## 📄 核心配置文件展示

### 1. 优化后的 Dockerfile

```dockerfile
FROM docker.m.daocloud.io/library/node:18-slim

# 兼容 Debian 11 和 12，安全地使用阿里云镜像源加速 apt 安装
RUN if [ -f /etc/apt/sources.list ]; then \
        sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list && \
        sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list; \
    fi && \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
        sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources; \
    fi

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
```

### 2. Nginx 反向代理配置 (`/etc/nginx/conf.d/resume.conf`)

```nginx
server {
    listen 8080;
    server_name 47.114.117.233;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

---

## 🔍 API 可用性与连通性验证

部署完成后，我们必须验证 PDF 渲染引擎是否真的能正常导出文件。我们在服务器内部向本机的 `8080` 端口发送了模拟的简历 PDF 导出请求：

```bash
curl -i -X POST -H 'Content-Type: application/json' \
  -d '{"theme":{"templateId":"classic","primaryColor":"#2563EB","fontFamily":"Noto Sans SC","fontSize":14,"lineHeight":1.6,"sectionGap":12},"basicInfo":{"name":"测试"},"sectionOrder":[]}' \
  http://127.0.0.1:8080/api/pdf -o /tmp/test.pdf -s -D -
```

**响应头反馈（Headers）：**
```http
HTTP/1.1 200 OK
Server: nginx/1.20.1
Date: Mon, 15 Jun 2026 10:11:46 GMT
Content-Type: application/pdf
Content-Length: 9127
Connection: keep-alive
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
content-disposition: attachment; filename="resume.pdf"
```

通过日志能够清晰看到，服务器返回了 `HTTP/1.1 200 OK`，`Content-Type: application/pdf` 且 PDF 大小为完美的 `9.2 KB`。生成文件正常，中文显示完美，至此，全部的容器化与反代部署成功收官！

*(注：如果需要在公网访问该页面，记得去阿里云控制台的安全组里放行 `8080` 入方向端口！)*
