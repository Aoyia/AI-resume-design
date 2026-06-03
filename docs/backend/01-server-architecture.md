# 服务端架构设计

## 运行时选择

项目采用 Next.js App Router，因此后端接口使用 Route Handler 实现。

所有以下模块必须声明 Node.js runtime：

- `app/api/auth/**`
- `app/api/resume/**`
- `app/api/pdf/route.ts`
- `app/print/export/[sessionId]/page.tsx`

原因：

- 需要读写数据库
- 需要使用 Puppeteer
- 需要访问文件系统或 Node API

## 建议目录结构

```text
src/
  app/
    api/
      auth/
        login/route.ts
        logout/route.ts
        session/route.ts
      resume/
        draft/route.ts
      pdf/
        route.ts
    print/
      export/
        [sessionId]/
          page.tsx
          print.module.css
  server/
    auth/
      auth.config.ts
      auth.service.ts
      auth-session.ts
      auth.schema.ts
    draft/
      draft.service.ts
      draft.repository.ts
      draft.schema.ts
    pdf/
      browser.ts
      export-session.service.ts
      export-session.repository.ts
      pdf.service.ts
      pdf.schema.ts
    repositories/
      prisma.ts
    shared/
      api-response.ts
      errors.ts
      logger.ts
      runtime.ts
```

## 分层职责

### Route Handler

职责：

- 读取请求体、query、cookie
- 调用 schema 校验
- 获取当前用户
- 调用 service
- 输出统一 JSON 或 PDF 响应

禁止做的事情：

- 直接写 Prisma 查询
- 拼接复杂业务对象
- 在路由内管理浏览器实例

### Service 层

职责：

- 组合业务流程
- 调用 repository
- 处理版本冲突、导出流程、权限规则
- 抛出领域错误

### Repository 层

职责：

- 只负责数据库读写
- 不做业务分支判断
- 统一返回领域实体或 `null`

## 请求流

### 登录

```text
POST /api/auth/login
  -> auth.schema 校验
  -> auth.service 校验固定账密
  -> 签发 session cookie
  -> 返回当前用户
```

### 草稿保存

```text
PUT /api/resume/draft
  -> 校验 session
  -> draft.schema 校验 ResumeData
  -> draft.service 根据 userId 保存草稿
  -> 返回服务端最新 draft
```

### PDF 导出

```text
POST /api/pdf
  -> 校验 ResumeData
  -> 创建 export session
  -> pdf.service 调用 Puppeteer 打开 /print/export/[sessionId]
  -> page.pdf() 生成 buffer
  -> 清理 export session
  -> 返回 PDF stream
```

## 环境变量

建议定义：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | Prisma 数据库连接串 |
| `SESSION_SECRET` | JWT 或加签 cookie 的密钥 |
| `APP_BASE_URL` | Puppeteer 访问本机页面所需基地址 |
| `DEMO_ADMIN_USERNAME` | 默认 `admin` |
| `DEMO_ADMIN_PASSWORD` | 默认 `123456`，生产环境必须覆盖 |
| `PDF_TIMEOUT_MS` | 导出超时，默认 `30000` |

## 统一响应封装

JSON 接口统一格式：

```ts
interface ApiSuccessResponse<T> {
  data: T;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

Route Handler 只通过 `ok(data)` 和 `fail(error)` 返回，减少格式漂移。
