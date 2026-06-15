# 项目 README 完善与 AI 简历 JSON 生成技能设计规格书

本文档定义了完善简历设计项目的 `README.md`，以及在 `.agents/skills/resume-json-builder/` 下开发专为 AI 助手使用的简历 JSON 生成与校验技能的设计规格。

## 1. 目标与背景

### 1.1 背景
本项目是一套基于 Next.js 的简历设计与生成应用（AI-resume-design），具有真 A4 纸张排版级渲染、拖拽重排、双击定位等先进交互特性。
目前，项目文档（`README.md`）过于简陋，未说明本地开发流程、核心数据流规范，也未对由于 GitHub Pages 静态部署导致无法在线导出 PDF 的局限性进行说明。
此外，由于简历数据（`ResumeData`）字段结构有特定强约束，AI 助手在协助用户生成或修改简历 JSON 时经常因为违反类型定义而导致导入报错（例如将 `skills` 生成为数组而非 Markdown 字符串）。

### 1.2 目标
1.  **完善 `README.md`**：提供详尽的本地运行与调试步骤，说明项目底层 Zustand 数据模型，并特别补充说明 GitHub Pages 的导出限制（如需导出 PDF，须在本地启动服务）。
2.  **开发 AI 技能 `resume-json-builder`**：开发一个存放在 `.agents/skills/` 下的 AI 辅助开发与数据构建技能，完全采用中文描述，指导 AI 100% 正确地处理简历 JSON 的生成、格式化和校验，从源头避免由于数据类型不匹配导致的导入失败。

---

## 2. 详细设计规格

### 2.1 README.md 完善规格
修改后的 `README.md` 将包含以下模块：
*   **项目概览**：介绍项目的技术栈（Next.js 14, React 18, Zustand, Arco Design, Puppeteer）与亮点功能。
*   **【重要】导出功能注意事项**：
    > [!IMPORTANT]
    > 在线演示版（GitHub Pages）为静态页面部署，**不支持 PDF 及 PNG 的导出功能**（因为导出依赖 Node.js 的 Puppeteer 后端服务）。如果需要导出简历，请务必克隆本项目并在本地运行开发服务器。
*   **本地开发启动指南**：
    *   安装依赖：`npm install`
    *   运行本地开发服务：`npm run dev`（服务运行在 `http://localhost:3000`）
    *   项目构建打包：`npm run build`
    *   本地生产运行：`npm run start`
*   **数据模型与 Zustand 状态规格说明**：简要列出核心简历数据 `ResumeData` 的关键结构，帮助开发者和 AI 能够快速浏览字段属性。

---

### 2.2 AI 技能 (`resume-json-builder`) 规格
在 `.agents/skills/resume-json-builder/SKILL.md` 中创建技能文件。

*   **元数据 (Frontmatter)**:
    ```yaml
    ---
    name: resume-json-builder
    description: 在为 AI-resume-design 应用生成、修改或校验可导入的结构化简历 JSON 数据时使用。
    ---
    ```
*   **何时使用 (When to Use)**:
    *   用户希望 AI 根据其背景生成可直接导入的简历 JSON 时。
    *   用户提供现有 JSON 简历，AI 需要对其进行字段修复、模块扩充或结构优化时。
    *   需要验证简历 JSON 文件的规范性与合法性时。
*   **特殊字段强约束说明**：
    *   `id`：简历主键及所有历程子项（`workExperience`, `projects` 等）的 `id` 必须是唯一的字符串。
    *   `skills`：**必须为单个 Markdown 字符串**（支持回车 `\n`），**严禁写成数组**。
    *   `dates` (日期)：所有的 `startDate` 和 `endDate` 必须遵循 `YYYY.MM` 或 `至今` 的格式（如 `2022.06` 或 `至今`）。
    *   `sectionOrder`：指定模块的前端展示顺序，类型为 `SectionKey[]`。
*   **核心 JSON 数据模板**：在 Skill 中提供一个合法的缩水版 JSON 示例，使 AI 在输出时可以直接按照该模式生成。
*   **常见错误与修正表**：
    *   `skills` 数组形式 -> 转为 Markdown 单字符串。
    *   日期包含中文（如 `2022年6月`） -> 转为 `2022.06`。
    *   子项目缺少唯一 `id` 属性 -> 生成随机唯一的 `id`（如 `work-1` 等）。

---

## 3. 验证方案

### 3.1 自动化与基本验证
1.  **语法校验**：在本地修改后运行 `npm run lint`，确保没有引入任何 TypeScript 或 ESLint 报错。
2.  **构建验证**：运行 `npm run build` 确保修改后的代码能正常编译通过。

### 3.2 手动与行为校验 (针对 AI Skill)
1.  **AI 意识测试**：新开启一个子智能体（不带该技能配置），让其根据随便一段工作背景生成 JSON。记录其是否会把 `skills` 错写为数组或出现日期格式错误。
2.  **技能应用测试**：启用本技能再次让 AI 生成相同的简历 JSON，验证生成的数据是否 100% 符合规范，并测试能否在应用前端中成功导入。
