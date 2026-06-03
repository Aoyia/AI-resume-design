# 校验、错误处理与安全设计

## 校验策略

所有接口使用 Zod 校验，分三层：

| 层级 | 位置 | 作用 |
| --- | --- | --- |
| 请求层 | `*.schema.ts` | 校验 body、query、cookie |
| 领域层 | `shared/resume/schema.ts` | 校验 `ResumeData` 结构 |
| 持久化前 | service 层 | 校验体积、条目上限、版本冲突 |

## 错误模型

建议定义领域错误基类：

```ts
class AppError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}
```

派生错误：

- `UnauthorizedError`
- `ValidationError`
- `ConflictError`
- `NotFoundError`
- `PdfGenerationError`

## Route 统一捕获

每个 Route Handler 外层使用统一包装：

```ts
export async function withRouteHandler<T>(handler: () => Promise<T>): Promise<Response>
```

职责：

- 捕获已知领域错误并转成 JSON
- 未知错误记录日志并返回 `500`
- 自动补充 request id

## 安全约束

### 认证

- cookie 必须是 HTTP-only
- 所有需要登录的接口先校验 session，再进业务逻辑
- 登出时清空 cookie，不能只清前端状态

### 输入内容

- Markdown 原文只按纯文本存储
- 预览渲染时关闭原始 HTML
- 对 URL 字段做白名单协议校验，仅允许 `http` 和 `https`

### 请求体限制

- `POST /api/pdf` 和 `PUT /api/resume/draft` 限制请求体大小
- 对超限请求直接返回 `413`

### 频率限制

MVP 推荐至少加两类简单限流：

- `/api/auth/login`：每 IP 每分钟最多 10 次
- `/api/pdf`：每用户每分钟最多 5 次

可先在内存 Map 实现，后续再换 Redis。

## 日志

日志字段建议包含：

- `requestId`
- `route`
- `userId`
- `durationMs`
- `result`
- `errorCode`

禁止记录：

- 用户密码
- 完整简历正文
- PDF 二进制内容

## 可观测性

建议在 `logger.ts` 提供以下方法：

- `info(event, payload)`
- `warn(event, payload)`
- `error(event, payload)`

重点日志节点：

- 登录成功/失败
- 草稿保存成功/失败
- PDF 导出开始/成功/失败
- 导出 session 过期

## 清理任务

需要有一个简单清理机制删除过期 `ExportSession`：

- 最简单方案：每次调用 `/api/pdf` 前先执行一次 `cleanupExpiredSessions()`
- 若后续有 cron，再改为定时清理

## 异常恢复原则

- 任意后端异常都不能影响前端本地草稿。
- PDF 生成失败时不触发草稿删除或版本回滚。
- 草稿保存失败时保留前端 `dirty` 状态，允许用户重试。
