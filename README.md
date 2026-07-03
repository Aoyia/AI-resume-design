# AI 简历设计工具 / AI-resume-design

> 🌐 **在线访问**
>
> | 环境 | 地址 |
> |------|------|
> | 🚀 阿里云（完整功能，含 PDF 导出） | http://47.114.117.233:8080 |
> | 📄 GitHub Pages（静态预览版） | https://aoyia.github.io/AI-resume-design |

一款基于 Next.js 14 开发的 **AI 友好型、真 A4 纸张排版级** 简历设计与编辑工具。

---

## 🌟 核心亮点

*   **真 A4 纸张排版**：提供精确到像素级的 A4 页面渲染，完美支持多页自动分页与边界测量，拒绝普通简历在打印时的格式崩塌。
*   **双击智能定位**：在右侧简历预览区域双击任意简历内容卡片，左侧配置面板将自动平滑滚动并展开对应的编辑手风琴（Accordion）面板，极大地提升了内容微调效率。
*   **纯前端拖拽重排**：底层集成了 Dnd Kit 拖拽库，支持对简历各大模块自由拖拽以调整展现顺序。
*   **零后端导入与导出**：简历数据完全支持本地 JSON 文件的一键导出与导入，不依赖特定数据库，数据安全可控。

---

## ⚠️ 【重要说明】关于导出 PDF/图片功能

> [!IMPORTANT]
> **在线预览版（GitHub Pages）限制**：
> 当前部署在 GitHub Pages 上的在线预览版本是**静态托管**的。因为简历的 PDF 和图片生成功能需要使用 Node.js 的 Puppeteer 后端服务在服务器端进行高清晰度的无头浏览器渲染，所以**在线预览版无法使用“导出 PDF”和“导出图片”功能**。
> 
> **如何解决**：
> 如果您需要完整使用简历的导出功能，请按照下方指南将本项目克隆到本地，并运行本地开发服务器。本地服务自带 API 导出路由，可以 100% 完美导出超清的 A4 简历文件。

---

## 🚀 本地开发启动指南

### 1. 安装依赖

请在项目根目录下执行以下命令安装依赖：

```bash
npm install
```

### 2. 启动本地开发服务

启动本地 Next.js 开发服务器：

```bash
npm run dev
```

启动成功后，在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可进行预览与编辑。

### 3. 项目构建与生产运行

如果您希望打包并以生产模式运行项目：

```bash
# 静态资源与页面打包
npm run build

# 启动本地生产服务器
npm run start
```

---

## 📊 简历 JSON 数据结构大纲

本项目的简历数据以 `ResumeData` 状态树进行管理，以下是主要的字段规范，便于您或 AI 协同工具进行编辑和理解：

*   **`id`** (`string`)：简历唯一标识符。
*   **`resumeName`** (`string`)：简历名称（导入导出时作为默认文件名）。
*   **`theme`** (`ResumeTheme`)：主题样式配置。
    *   `templateId` (`string`)：模板 ID（如 `classic`）。
    *   `primaryColor` (`string`)：主题色（十六进制颜色码，如 `#2563EB`）。
    *   `fontFamily` (`string`)：字体族（如 `Noto Sans SC`）。
    *   `fontSize` (`number`)：基准字号（像素值，默认 `14`）。
    *   `lineHeight` (`number`)：行高（默认 `1.6`）。
    *   `sectionGap` (`number`)：模块间距（像素值，默认 `12`）。
*   **`basicInfo`** (`BasicInfo`)：个人基本信息，包含姓名、求职意向、联系方式等。
*   **`skills`** (`string`)：**【特别注意】** 专业技能是一个**包含换行的单个 Markdown 字符串**，请勿使用数组结构。
*   **`workExperience` / `projects`** (`ExperienceItem[]`)：工作与项目经历数组。每个子项均需包含唯一的 `id`，其描述字段 `description` 支持 Markdown 语法。
*   **`sectionOrder`** (`SectionKey[]`)：定义大模块在前台的渲染顺序。

---

## 🤝 AI 协同开发指南

本项目内置了专供 AI 使用的协作技能。
如果您正在使用 AI 编程助手（如 Cursor、Claude 等）共同开发或优化简历，您可以让 AI 助手先激活 `.agents/skills/resume-json-builder` 技能。
AI 助手将遵循该技能的类型约束，为您生成 100% 兼容的简历 JSON 文件。您可以直接点击界面上的「导入 JSON」按钮，一键载入数据。

---

## 许可证 / License

[MIT](./LICENSE)
