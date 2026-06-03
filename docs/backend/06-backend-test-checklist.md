# 后端测试清单

## 单元测试

建议覆盖以下 service 和工具函数：

| 模块 | 用例 |
| --- | --- |
| `auth.service` | 正确账号通过，错误账号拒绝 |
| `auth-session` | 能签发并验证有效 session |
| `draft.service` | 新建草稿、更新草稿、版本冲突 |
| `export-session.service` | 创建、消费、过期清理 |
| `pdf.service` | URL 拼装、导出参数和错误转换 |
| `withRouteHandler` | 已知错误与未知错误响应正确 |

## 接口集成测试

至少覆盖以下路径：

1. `POST /api/auth/login` 成功设置 cookie。
2. `GET /api/auth/session` 在未登录时返回空用户。
3. `PUT /api/resume/draft` 未登录时返回 401。
4. 登录后首次 `PUT /api/resume/draft` 创建草稿。
5. 二次保存时版本号递增。
6. 用旧版本号提交保存时返回 409。
7. `POST /api/pdf` 在合法 payload 下返回 `application/pdf`。
8. 使用过期 `sessionId` 访问打印页时返回 404。

## 联调测试

需要前后端一起验证：

- 登录后前端自动读取云端草稿
- 自动保存失败时前端状态变成 `error`
- 导出成功后浏览器能下载 PDF
- 多页简历导出内容顺序正确

## PDF 专项人工测试

- 单页简历导出
- 两页简历导出
- 含长 Markdown 列表的工作经历导出
- 中英文混排导出
- 主题色修改后导出

## 回归重点

- cookie 设置是否因环境切换失效
- Prisma migration 后旧草稿是否仍能读取
- 浏览器实例复用时是否出现资源泄漏
