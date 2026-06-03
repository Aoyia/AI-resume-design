# 纯粹简历制作应用：系统架构与前后端技术方案 (Tech Spec)

## 一、系统架构总览

本系统定位于一款“用完即走、直接产出工业级 PDF 与超高清图片”的轻量化 C 端工具。考虑到对最高完美度 PDF 的追求以及极简体验，我们采用 **BFF (Backend for Frontend)** 架构模型，使用 Next.js 进行前后端同构。

```mermaid
graph TD
    subgraph 前端浏览器环境 (Client)
        A[状态管理 Zustand] -->|双向绑定| B(UI 编辑器组件)
        B -->|修改数据| A
        A -->|渲染指令| C[Template Renderer 预览]
        
        A -->|Payload| D[发起导出 PDF / 图片请求]
        E[账密授权/LocalStorage] -->|持久化| A
    end

    subgraph 后端 / Next.js Serverless 环境
        D -->|HTTP POST| F[API Route: /api/pdf]
        F -->|注入 JSON 数据| G(隐式唤起 Headless Browser / Puppeteer)
        G -->|访问隐藏打印路由 /print| H[内部服务端渲染生成]
        H -->|导出 Buffer| I[返回 PDF 或 PNG 字节流]
    end

    I -->|下载流| D
```

---

## 二、前端技术方案与设计模式

### 1. 业务逻辑层：状态驱动设计 (State-Driven)
*   **引擎**：使用 **Zustand**，极轻量级的 Flux 模型实现全局数据共享。
*   **性能优化**：所有表单组件使用精细颗粒度 Selector 进行局部订阅，避免不必要的全局 Re-render；输入框与文本域采用 150ms 局部状态防抖。
*   **本地先行容灾**：使用 `persist` 中间件，自动同步到 LocalStorage，在未登录状态下依然可以实现数据防丢。

### 2. 交互层与拖拽排序
*   **手风琴折叠与拖拽**：使用 `@dnd-kit/core` 与 `@dnd-kit/sortable`。左侧编辑器纯白化，仅在 Hover 时显现拖拽手柄 `⋮⋮` 与收起/删除操作，减少视觉噪音。
*   **Markdown 解析**：工作经历等描述输入完全支持 Markdown 语法，实时解析并渲染为标准 Bullet Points。

### 3. 解耦式模板引擎与 A4 动态分页
*   **解耦设计**：采用策略模式。`TemplateRenderer` 统一接收数据，并加载对应的模板组件（例如 `ClassicTemplate`）。
*   **DOM 测量与分页算法**：
    * 预览和打印组件都使用动态高度计算沙盒。
    * 将经历数据拍平为扁平节点数组进行流式高度测量（首个经历项强制与大标题绑定防止孤立断页）。
    * 高度超出 A4 纸张页面限高（1027px）后，自动截断并在下一页进行分配渲染。
    * 计算完成后打上 `data-ready="true"` 标记。

---

## 三、双导出方案设计（BFF & Puppeteer）

为了达到与预览效果的 100% 绝对一致（所见即所得），采用服务端 Puppeteer 后端渲染与导出。

### 1. API 接口逻辑 (`/api/pdf`)
后端接口支持通过 POST Payload 接收简历 JSON 数据 `resume` 和导出格式 `format?: 'pdf' | 'image'`。

#### (1) PDF 导出流程
1. 将接收到的数据存入后端的内存临时存储 `resumeTempStore`，生成唯一的 `id`。
2. 启动 Puppeteer 无头浏览器。
3. 导航至 `/print?id=xxx` 页面。
4. 等待客户端动态分页测量并标记 `data-ready="true"`。
5. 等待系统字体加载就绪 `document.fonts.ready`。
6. 调用 `page.pdf()` 输出 A4 尺寸、0 边距、包含背景的矢量 PDF。
7. 返回 PDF 二进制字节流。

#### (2) 图片（PNG）导出流程
1. 前 4 步流程与 PDF 导出一致。
2. 客户端分页就绪后，调用 `page.setViewport` 设置物理视口，并配置 **`deviceScaleFactor: 4` (物理分辨率 4 倍提升，实现极致超清印刷级别)**。
3. 通过 CSS 选择器选取包含所有 A4 纸张容器的 `.print-wrapper` 节点。
4. 调用 `element.screenshot({ type: 'png', omitBackground: false })` 获取屏幕快照 Buffer。
5. 返回 `image/png` 格式的字节流，强制以附件形式触发下载。

### 2. 打印控制 CSS (`print.css`)
```css
@media print {
  @page {
    size: A4;
    margin: 0; /* 移除浏览器默认页眉页脚 */
  }
  
  .print-page-container {
    page-break-after: always;
    break-after: always; /* 强制页面之间断开 */
  }
  
  .experience-item {
    page-break-inside: avoid;
    break-inside: avoid; /* 防止单项经历被腰斩 */
  }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact; /* 打印背景色 */
  }
}
```

---

## 四、本地数据与账密体系简述

*   **假登录 / 轻态登录**：提供固定的 `admin` / `123456` 登录。登录状态下在前端会有同步云端的状态展示（模拟云同步逻辑），所有改动都会触发自动保存。
*   **本地草稿优先**：所有数据读写和操作均以 `localStorage` 为首要基础，不登录也可以免费、无障碍地畅享 100% 的所有编辑器和导出功能。
