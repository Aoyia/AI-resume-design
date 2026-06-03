# 草稿同步服务设计

## 服务目标

登录用户在编辑简历时，后端需要提供稳定的草稿读取和覆盖保存能力。MVP 不做历史版本列表，但必须保留版本号，方便后续解决冲突。

## 接口定义

### `GET /api/resume/draft`

返回：

```ts
interface GetResumeDraftResponse {
  draft: ResumeData | null;
}
```

行为：

- 未登录返回 `401 UNAUTHORIZED`
- 已登录但没有草稿时返回 `draft: null`

### `PUT /api/resume/draft`

请求：

```ts
interface SaveResumeDraftRequest {
  draft: ResumeData;
  clientVersion: number;
}
```

返回：

```ts
interface SaveResumeDraftResponse {
  draft: ResumeData;
}
```

## 数据校验

后端必须做两层校验：

1. 请求结构校验：`draft` 是否存在、`clientVersion` 是否为数字。
2. 内容校验：`draft` 是否符合共享 `ResumeData` schema。

额外限制：

- 工作经历最多 20 条
- 项目经历最多 20 条
- 技能组最多 10 组
- 单个 Markdown 描述不超过 5000 字符
- 整份 JSON 序列化后不超过 `300KB`

## 保存策略

### upsert 逻辑

草稿按 `userId + draftKey=primary` 唯一保存。

保存流程：

1. 根据 `userId` 查询草稿。
2. 若不存在则创建，版本号置为 `1`。
3. 若存在则比较 `clientVersion` 与当前版本。
4. 若 `clientVersion < currentVersion`，返回 `409 DRAFT_VERSION_CONFLICT`。
5. 否则覆盖内容并将版本号加 `1`。

## Service 接口

```ts
getDraft(userId: string): Promise<ResumeData | null>
saveDraft(input: {
  userId: string;
  draft: ResumeData;
  clientVersion: number;
}): Promise<ResumeData>
```

## Repository 接口

```ts
findPrimaryByUserId(userId: string): Promise<ResumeDraftEntity | null>
upsertPrimary(input: {
  userId: string;
  content: ResumeData;
  nextVersion: number;
}): Promise<ResumeDraftEntity>
```

## 时间字段处理

服务端保存成功后必须写回：

- `meta.version = 数据库最新版本`
- `meta.updatedAt = 服务器当前 ISO 时间`

这样前端后续导出和冲突判断都能依赖同一份元信息。

## 幂等与吞吐

由于前端自动保存采用 debounce，请求频率不会太高，但后端仍需注意：

- 同一个用户同一时刻只允许一个保存事务执行
- 可以通过数据库事务或乐观锁保证版本更新正确
- 连续收到相同内容时可直接返回当前草稿，不重复写库

## 错误码

| 错误码 | 场景 |
| --- | --- |
| `UNAUTHORIZED` | 未登录 |
| `INVALID_PAYLOAD` | 请求结构错误 |
| `RESUME_VALIDATION_FAILED` | 简历字段不符合 schema |
| `DRAFT_TOO_LARGE` | 草稿体积超限 |
| `DRAFT_VERSION_CONFLICT` | 版本冲突 |
| `INTERNAL_SERVER_ERROR` | 未知异常 |

## 未来扩展预留

当前只保存一份主草稿，但表结构和 service 命名需允许后续扩展：

- 多份简历草稿
- 草稿历史版本
- 模板切换记录
