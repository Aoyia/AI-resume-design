# 别再手动部署了！用 GitHub Actions 自动部署到阿里云并用飞书卡片“躺平”监控

> **作者**：阿毅  
> **碎碎念**：每天写完代码，手动打包、FTP上传、SSH连服务器、重启 Docker、重载 Nginx……这一套折腾下来，头发又少了几根。最惨的是，偶尔漏了某一步，线上直接炸裂。为了拯救我日渐稀疏的头顶，我花了一下午把项目的 CI/CD 流水线给跑通了。现在只要 `git push`，剩下的脏活累活全交给 GitHub 虚拟机，部署成功了飞书还会叮咚弹个大绿卡片，那感觉，别提多爽了！

---

## 🚀 核心架构：我们在折腾啥？

其实原理很简单，一共就三步：
1. **GitHub 帮我们干活**：我们把代码一推（`git push`），GitHub 会免费提供一台小虚拟机（Runner），自动帮我们把源码打包。
2. **小飞机运包到阿里云**：虚拟机通过 SCP 把打包好的代码丢到我们的阿里云 ECS 服务器上。
3. **服务器自己重装运行**：虚拟机再通过 SSH 登录我们的服务器，解包、用 Docker 重新构建镜像、重新跑容器、重载 Nginx，最后把结果通过飞书 Webhook 丢到群里。

---

## 🛠 源码奉上：`.github/workflows/aliyun-deploy.yml`

在项目根目录下新建 `.github/workflows/aliyun-deploy.yml`，把下面的配置抄进去：

```yaml
name: Deploy to Aliyun ECS

on:
  push:
    branches:
      - master # 只有 master 分支被推送时才触发

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      # 避坑绝招：先把压缩包打包到上级目录，避免 tar 自吞自
      - name: Tar Source Code
        run: |
          tar -czf ../resume.tar.gz \
            --exclude='node_modules' \
            --exclude='.next' \
            --exclude='out' \
            --exclude='.git' \
            --exclude='.github' \
            --exclude='deploy.log' \
            --exclude='scratch' \
            .
          mv ../resume.tar.gz .

      - name: Upload Tarball to Aliyun ECS
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}
          source: "resume.tar.gz"
          target: "/root/"

      - name: Run Deploy Command on Aliyun ECS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}
          script: |
            echo '=== [1] 解压源码 ==='
            rm -rf /root/resume && mkdir -p /root/resume
            tar -xzf /root/resume.tar.gz -C /root/resume
            rm -f /root/resume.tar.gz

            echo '=== [2] 使用 Docker 构建镜像 ==='
            cd /root/resume
            docker build -t resume-app .

            echo '=== [3] 运行 Docker 容器 ==='
            docker stop resume-app || true
            docker rm resume-app || true
            docker run -d --name resume-app \
              -p 127.0.0.1:3000:3000 \
              --restart always \
              -e PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
              resume-app

            echo '=== [4] 验证容器运行状态 ==='
            docker ps | grep resume-app

            echo '=== [5] 重载 Nginx 配置 ==='
            nginx -t && systemctl reload nginx || systemctl restart nginx
            echo '=== 部署完成！ ==='

      # 成功通知：用 jq 安全拼装飞书卡片 JSON，防止提交信息里的引号和换行搞崩 shell
      - name: Notify Lark on Success
        if: success()
        run: |
          jq -n \
            --arg msg "${{ github.event.head_commit.message }}" \
            --arg actor "${{ github.actor }}" \
            --arg host "${{ secrets.ALIYUN_HOST }}" \
            '{
              msg_type: "interactive",
              card: {
                config: { wide_screen_mode: true },
                header: {
                  title: { tag: "plain_text", content: "🚀 AI 简历设计 - 部署成功" },
                  template: "green"
                },
                elements: [
                  {
                    tag: "div",
                    text: {
                      tag: "lark_md",
                      content: ("**构建状态**: ✅ Success\n**部署分支**: `master`\n**最新提交**: " + $msg + "\n**提交作者**: " + $actor + "\n**部署主机**: `" + $host + "`")
                    }
                  },
                  { tag: "hr" },
                  {
                    tag: "note",
                    elements: [{ tag: "plain_text", content: "服务已成功启动，且 Nginx 已平滑重载配置。" }]
                  }
                ]
              }
            }' > lark_success.json
          curl -X POST "${{ secrets.LARK_WEBHOOK_URL }}" -H "Content-Type: application/json" -d @lark_success.json

      # 失败通知
      - name: Notify Lark on Failure
        if: failure()
        run: |
          jq -n \
            --arg msg "${{ github.event.head_commit.message }}" \
            --arg actor "${{ github.actor }}" \
            --arg host "${{ secrets.ALIYUN_HOST }}" \
            '{
              msg_type: "interactive",
              card: {
                config: { wide_screen_mode: true },
                header: {
                  title: { tag: "plain_text", content: "❌ AI 简历设计 - 部署失败" },
                  template: "red"
                },
                elements: [
                  {
                    tag: "div",
                    text: {
                      tag: "lark_md",
                      content: ("**构建状态**: 🔴 Failed\n**部署分支**: `master`\n**最新提交**: " + $msg + "\n**触发作者**: " + $actor + "\n**部署主机**: `" + $host + "`")
                    }
                  },
                  { tag: "hr" },
                  {
                    tag: "note",
                    elements: [{ tag: "plain_text", content: "流水线执行中途出错，请前往 GitHub Actions 查看错误日志。" }]
                  }
                ]
              }
            }' > lark_failure.json
          curl -X POST "${{ secrets.LARK_WEBHOOK_URL }}" -H "Content-Type: application/json" -d @lark_failure.json
```
