# 前端接口接入与 PDF 导出链路

## API 客户端目录

```text
src/modules/auth/services/auth-client.ts
src/modules/resume-editor/services/resume-client.ts
src/modules/resume-editor/services/pdf-client.ts
src/shared/http/api-contracts.ts
src/shared/http/error.ts
```

## 统一请求封装

实现 `requestJson<T>()` 和 `requestBlob()` 两个基础方法：

- 自动附带 `credentials: 'include'`
- 统一解析错误响应
- 超时控制默认 `15s`
- 失败时抛出标准化 `AppHttpError`

错误结构统一为：

```ts
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

## 认证相关接口

### `POST /api/auth/login`

请求：

```ts
interface LoginRequest {
  username: string;
  password: string;
}
```

响应：

```ts
interface LoginResponse {
  user: {
    username: string;
  };
}
```

前端处理：

- 登录成功后关闭弹窗。
- 调用 `GET /api/auth/session` 二次确认服务端会话。
- 立刻触发一次 `GET /api/resume/draft`。

### `POST /api/auth/logout`

前端处理：

- 成功后清空 store 中的 `auth` 状态。
- 本地草稿不清空，继续允许离线编辑。

### `GET /api/auth/session`

用于页面初始化时探测登录状态。

## 草稿同步接口

### `GET /api/resume/draft`

返回当前登录用户最近一次云端草稿：

```ts
interface ResumeDraftResponse {
  draft: ResumeData | null;
}
```

### `PUT /api/resume/draft`

请求：

```ts
interface SaveResumeDraftRequest {
  draft: ResumeData;
  clientVersion: number;
}
```

响应：

```ts
interface SaveResumeDraftResponse {
  draft: ResumeData;
}
```

前端规则：

- 未登录时不调用。
- 连续输入时只保留最后一次请求。
- 若上一次同步尚未结束，新请求会中止旧请求并发送最新状态。

## PDF 导出接口

### `POST /api/pdf`

请求：

```ts
interface ExportPdfRequest {
  draft: ResumeData;
}
```

响应：

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="resume.pdf"`

前端实现步骤：

1. 点击下载按钮。
2. 先用共享 schema 做一次完整校验。
3. 通过 `pdf-client.ts` 发起 `POST /api/pdf`。
4. 收到 blob 后调用 `downloadBlob(blob, filename)`。
5. 结束后恢复按钮状态。

## 关键 Hook

| Hook | 责任 |
| --- | --- |
| `useBootstrapSession` | 页面启动时探测 session 和远端草稿 |
| `useResumeAutoSync` | 监听 dirty 状态并 debounce 保存 |
| `useExportPdf` | 包装导出校验、请求、下载、错误提示 |
| `useDraftConflictResolver` | 处理本地/云端草稿冲突 |

## 启动流程

```text
进入 /
  -> 读取 localStorage 草稿
  -> 注入 store
  -> 请求 /api/auth/session
  -> 若已登录则请求 /api/resume/draft
  -> 判断是否出现草稿冲突
  -> 开始正常编辑
```

## 导出失败处理

| 错误类型 | 前端处理 |
| --- | --- |
| 400 数据校验失败 | toast 展示具体缺失字段 |
| 401 会话失效 | 提示重新登录，但不丢本地草稿 |
| 413 草稿过大 | 提示用户精简内容 |
| 500 PDF 生成失败 | toast 提示稍后重试，并记录错误码 |
| 网络超时 | 提供“重新尝试”按钮 |

## 下载文件名规则

- 若 `fullName` 非空，文件名使用 `${fullName}-resume.pdf`
- 否则使用 `resume.pdf`

文件名生成逻辑放在 `src/lib/download.ts`，不要分散在按钮组件内。
