# 前端应用架构

## 技术选型

| 维度 | 方案 |
| --- | --- |
| 框架 | Next.js App Router + React + TypeScript |
| 样式 | CSS Modules + 全局变量文件 `src/styles/tokens.css` |
| 状态管理 | Zustand |
| 表单校验 | Zod |
| Markdown 渲染 | `react-markdown` |
| 拖拽 | `@dnd-kit/core` + `@dnd-kit/sortable` |
| 请求层 | 浏览器原生 `fetch`，封装统一客户端 |

## 页面与路由

| 路由 | 作用 | 前端职责 |
| --- | --- | --- |
| `/` | 编辑器主页面 | 加载本地草稿、展示编辑器和预览、触发登录和下载 |
| `/print/export/[sessionId]` | 打印专用页面 | 仅供后端 Puppeteer 访问，前端不提供入口 |

## 编辑器页面结构

```text
EditorPage
  ├─ TopToolbar
  │   ├─ LoginStatusButton
  │   ├─ ThemeControlGroup
  │   ├─ TypographyControlGroup
  │   └─ ExportPdfButton
  ├─ EditorLayout
  │   ├─ LeftPanel
  │   │   ├─ SectionNavigator
  │   │   └─ ResumeEditorAccordion
  │   └─ RightPanel
  │       ├─ PreviewToolbar
  │       └─ ResumePreviewCanvas
  └─ GlobalPortalHost
      ├─ LoginModal
      ├─ ConfirmDialog
      └─ ToastViewport
```

## 建议代码目录

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    print/
      export/
        [sessionId]/
          page.tsx
          print.module.css
  modules/
    auth/
      components/
      hooks/
      services/
    resume-editor/
      components/
        toolbar/
        shell/
        section-list/
        forms/
      hooks/
      utils/
    resume-preview/
      components/
      hooks/
      layout/
    template/
      components/
      default-template/
  shared/
    resume/
      constants.ts
      defaults.ts
      schema.ts
      types.ts
    http/
      api-contracts.ts
      error.ts
  store/
    editor-store.ts
    selectors.ts
    persist.ts
  lib/
    id.ts
    debounce.ts
    markdown.ts
    download.ts
```

## 模块边界

### `app`

只负责路由入口、页面拼装、SEO 和运行时声明，不承载业务细节。

### `modules/auth`

负责登录弹窗、登录状态展示、会话读取、登出。认证信息只通过 store 和 API client 读写，不允许其他模块直接操作 cookie。

### `modules/resume-editor`

负责左侧表单区、拖拽排序、局部字段校验、交互反馈。该模块不关心 PDF 生成细节。

### `modules/resume-preview`

负责右侧 A4 预览、缩放、分页、与模板系统协作。预览只消费标准 `ResumeData`。

### `modules/template`

负责根据 `templateId` 选择模板组件。当前仅提供 `default` 模板，但渲染器必须允许后续新增模板时不改 editor 逻辑。

### `shared/resume`

前后端共用的类型、默认值、schema、常量必须统一放这里。字段增删只能改这里，再向外扩散。

## 状态流

```text
表单输入
  -> store action
  -> Zustand state 更新
  -> 本地持久化
  -> 右侧预览重新渲染
  -> 若已登录则触发 debounce 云端同步
```

## 关键实现约束

- 编辑器和预览不得维护两份独立数据源。
- 所有写操作只能通过 store action，禁止组件直接 `setState` 维护真实简历数据。
- 预览样式和打印样式必须共享模板级 token，不能出现“预览一套样式、打印另一套样式”的结构性分叉。
- 页面只做 PC 端布局，不做移动端适配，但需要在过窄窗口下给出遮罩提示或最小宽度保护。
