# 后端详细设计

## 目标

本目录定义简历站点后端的实现方案，重点覆盖三类能力：

- 极简认证与会话管理
- 登录后的草稿云端同步
- 高保真 PDF 生成与打印路由

本设计默认后端仍运行在 Next.js 应用内，采用 BFF 结构，不单独拆独立服务。

## 文档清单

- `01-server-architecture.md`：路由、服务层、仓储层、运行时和目录结构。
- `02-data-storage-and-auth.md`：持久化方案、Prisma 数据模型、登录鉴权设计。
- `03-draft-sync-service.md`：草稿读取/保存接口与同步机制。
- `04-pdf-export-and-print-service.md`：Puppeteer、导出会话、打印路由实现。
- `05-validation-error-and-security.md`：校验、错误处理、安全边界、日志。
- `06-backend-test-checklist.md`：后端单测、集成、联调验收项。

## 实施原则

- 所有 Route Handler 只做参数解析、鉴权、响应封装，不写复杂业务逻辑。
- 所有核心逻辑放入 `src/server`。
- 所有接口输入输出必须经过 Zod 校验。
- PDF 导出和认证接口都强制运行在 Node.js runtime。
- 前后端共享同一份 `ResumeData` schema，后端不维护第二套结构。
