# 数据存储与鉴权设计

## 持久化选型

MVP 推荐使用 `Prisma + SQLite`，原因：

- 开发启动成本最低
- 单用户演示站足够
- 能稳定保存草稿和导出会话
- 后续可较低成本迁移到 PostgreSQL

为避免业务层绑定数据库实现，仍需在 service 上层通过 repository 抽象读写。

## 数据模型

建议 Prisma schema 如下：

```prisma
model User {
  id           String       @id @default(cuid())
  username     String       @unique
  passwordHash String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  drafts       ResumeDraft[]
}

model ResumeDraft {
  id         String   @id @default(cuid())
  userId     String
  draftKey   String   @default("primary")
  content    Json
  version    Int      @default(1)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, draftKey])
}

model ExportSession {
  id         String   @id @default(cuid())
  userId     String?
  payload    Json
  status     String   @default("pending")
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  usedAt     DateTime?
}
```

## 初始化策略

- 首次迁移后执行 `prisma/seed.ts`
- 若数据库不存在 `admin` 用户，则写入默认账号
- 生产环境不要把明文密码写死在 seed 内，seed 从环境变量读取

## 固定账密设计

虽然产品只需要固定账号密码，但后端仍应按真实鉴权流程组织，避免后续扩展时推翻重写。

### 配置文件

`src/server/auth/auth.config.ts`

职责：

- 从环境变量读取默认用户名、明文密码
- 在启动时计算或比对密码 hash

### 鉴权 Service

`src/server/auth/auth.service.ts`

核心方法：

```ts
validateCredential(input: { username: string; password: string }): Promise<{ userId: string; username: string }>
getCurrentUser(sessionToken: string | undefined): Promise<{ userId: string; username: string } | null>
logout(): Promise<void>
```

## Session 方案

使用 HTTP-only signed cookie，不使用 localStorage 存 token。

建议：

- cookie 名：`resume_session`
- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: true`（生产）
- `path: '/'`
- 过期时间：7 天

实现方式：

- 用 `jose` 签一个最小 JWT，payload 只包含 `userId`、`username`、`exp`
- `auth-session.ts` 负责 `signSession()` 和 `verifySession()`

## 认证接口

### `POST /api/auth/login`

流程：

1. Zod 校验用户名密码不能为空。
2. 调用 `auth.service.validateCredential()`。
3. 签发 session cookie。
4. 返回用户名。

失败返回：

- `401 INVALID_CREDENTIAL`

### `POST /api/auth/logout`

流程：

- 清空 cookie
- 返回 `{ success: true }`

### `GET /api/auth/session`

流程：

- 验证 cookie
- 有效则返回当前用户
- 无效则返回 `user: null`

## Repository 拆分

| 文件 | 责任 |
| --- | --- |
| `auth.service.ts` | 认证流程 |
| `auth-session.ts` | cookie 签发与验证 |
| `draft.repository.ts` | 草稿读写 |
| `export-session.repository.ts` | 导出会话读写与清理 |
| `repositories/prisma.ts` | PrismaClient 单例 |

## 密码安全

- 不要在代码中直接比对明文，启动时使用 `bcrypt` 或 `argon2` 比较 hash。
- 开发环境可允许通过明文环境变量自动生成 hash。
- 日志中绝不记录密码原文。
