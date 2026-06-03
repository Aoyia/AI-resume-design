# 前端测试清单

## 单元测试

建议使用 Vitest 或 Jest，覆盖以下核心模块：

| 模块 | 用例 |
| --- | --- |
| `resume defaults` | 能创建空白简历和默认条目 |
| `editor-store` | 各类 update/add/remove/reorder action 行为正确 |
| `selectors` | 选择器不会返回错误字段 |
| `paginateBlocks` | 不同高度布局块能正确拆成多页 |
| `splitMarkdownBlocks` | 超长 Markdown 能按段落切分 |
| `download.ts` | 文件名生成和 blob 下载逻辑正常 |

## 组件测试

建议覆盖：

- `BasicsForm` 输入联动预览
- `WorkItemForm` Markdown 输入后预览渲染 bullet list
- `ResumeEditorAccordion` 展开收起逻辑
- `ExportPdfButton` loading 和禁用态
- `LoginModal` 账密输入与错误提示

## 集成测试

需要验证以下用户路径：

1. 用户未登录进入页面，读取本地草稿并展示。
2. 修改基本信息后，右侧预览即时更新。
3. 新增两条工作经历并拖拽排序，预览顺序同步变化。
4. 登录成功后自动拉取服务端草稿。
5. 已登录状态下修改内容，`1200ms` 后触发自动同步。
6. 导出按钮在校验通过后触发下载。

## E2E 验收

建议用 Playwright，至少覆盖：

- 离线编辑 + 刷新页面 + 草稿仍存在
- 登录成功 + 自动保存提示变化
- 工作经历 Markdown 预览正确
- 多页预览可见第二页
- 点击下载后拿到 PDF 响应
- 退出登录后仍可继续编辑本地草稿

## 人工走查项

- 窗口缩放到较窄尺寸时是否给出 PC 限制提示
- 主题色切换后预览和打印色值是否一致
- 极长项目描述时分页是否出现标题孤儿行
- 浏览器刷新、登出、导出失败等场景是否丢失当前输入
