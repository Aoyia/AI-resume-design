# PDF 导出与打印服务设计

## 目标

生成的 PDF 必须满足：

- 文本可选中，可复制，非截图
- 支持多页，分页干净
- 和右侧预览视觉尽量一致
- 用户点击一次下载按钮即可拿到文件

## 接口定义

### `POST /api/pdf`

请求：

```ts
interface ExportPdfRequest {
  draft: ResumeData;
}
```

响应：

- `200 application/pdf`
- 文件名从 `fullName` 推导

## 整体流程

```text
前端提交 ResumeData
  -> 校验 payload
  -> 创建 export session
  -> 启动 Puppeteer 或复用浏览器实例
  -> 打开 /print/export/[sessionId]
  -> 等待页面、字体、图片加载完成
  -> page.pdf()
  -> 删除或标记 export session 已使用
  -> 返回 PDF buffer
```

## Export Session 设计

引入 `ExportSession` 的目的：

- 避免把整份简历 JSON 塞进 URL
- 让打印页以服务端受控方式读取数据
- 避免 URL 长度和敏感信息暴露问题

### Service 接口

```ts
createSession(input: { userId?: string; payload: ResumeData }): Promise<{ sessionId: string }>
consumeSession(sessionId: string): Promise<ResumeData>
markSessionUsed(sessionId: string): Promise<void>
cleanupExpiredSessions(): Promise<void>
```

### 生命周期

- 创建时 `expiresAt = now + 10 minutes`
- 成功导出后标记 `usedAt`
- 定时或在请求结束后清理过期记录

## Puppeteer 浏览器管理

建议封装 `src/server/pdf/browser.ts`：

```ts
getBrowser(): Promise<Browser>
closeBrowser(): Promise<void>
```

实现原则：

- 开发环境复用单例浏览器实例，减少重复启动开销
- 生产环境若部署为长期运行 Node 服务，同样可复用单例
- 若部署为 serverless，则在单次请求内启动并关闭

## PDF Service

`src/server/pdf/pdf.service.ts`

职责：

- 创建导出 session
- 拼装打印 URL
- 设置页面 viewport
- 等待加载完成
- 生成 PDF buffer

关键参数建议：

```ts
await page.pdf({
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
  },
});
```

## 打印页设计

### 路由

`app/print/export/[sessionId]/page.tsx`

职责：

- 从 `sessionId` 读取导出数据
- 校验 session 是否存在且未过期
- 以 `mode="print"` 渲染 `TemplateRenderer`
- 引入专属打印样式

### 页面行为

- 不显示工具栏、交互按钮、边框阴影
- 页面背景为白色
- body 宽度按 A4 内容宽度铺满

## 打印 CSS 约束

`print.module.css` 至少包含：

```css
@page {
  size: A4;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
  background: #fff;
}

.page {
  width: 210mm;
  min-height: 297mm;
  break-after: page;
}

.keepTogether {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

## 加载完成判定

Puppeteer 打印前至少做以下等待：

- `page.goto(url, { waitUntil: 'networkidle0' })`
- `await page.evaluate(() => document.fonts.ready)`
- 若模板依赖外部图片或字体，需要额外检测关键节点存在

## 超时与失败处理

- 导出总超时默认 `30s`
- `session` 不存在或过期返回 `404 EXPORT_SESSION_NOT_FOUND`
- 浏览器启动失败返回 `500 PDF_BROWSER_START_FAILED`
- 打印页渲染失败返回 `500 PDF_RENDER_FAILED`

## 质量验收

- 2 页以上简历不得出现半截条目被截断
- 中文和英文混排时文字不能变位
- 放大 500% 后文字仍清晰
- 文本复制粘贴后顺序正确
