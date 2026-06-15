# 完善项目 README 与开发 AI 简历数据生成技能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 完善项目 README 并开发一个名为 `resume-json-builder` 的中文 AI 技能。

**架构：** 补充 `README.md` 提供完整本地启动、构建指南及数据模型大纲。在 `.agents/skills/resume-json-builder/SKILL.md` 下定义包含元数据、特有类型强约束、校验对照表的 AI 技能以规避 AI 助手生成脏数据的风险。

**技术栈：** Next.js 14, React 18, Zustand, Markdown, AI Skill Spec.

---

### 任务 1：完善项目的 README.md

**文件：**
- 修改：`README.md`

- [ ] **步骤 1：编写最少实现代码**
  修改 `README.md` 的内容，替换为中文编写的系统项目说明书，包含项目简介、重要注意事项（GitHub Pages 导出 PDF 失败，须本地运行）、本地运行/构建命令列表、简历底层数据结构大纲等。

- [ ] **步骤 2：运行测试验证通过**
  无自动化测试，手动查看 README.md 链接及文字排版是否整洁无错。

- [ ] **步骤 3：Commit**
  ```bash
  git add README.md
  git commit -m "docs: 完善项目 README.md 文档，补充核心功能与本地导出说明"
  ```

---

### 任务 2：开发 AI 技能 resume-json-builder

**文件：**
- 创建：`.agents/skills/resume-json-builder/SKILL.md`

- [ ] **步骤 1：编写最少实现代码**
  在 `.agents/skills/resume-json-builder/SKILL.md` 中用中文编写针对本项目的 AI 技能，包括 YAML frontmatter 元数据、适用场景（When to use）、核心约束机制（`skills` 为换行 Markdown 字符串、日期格式 `YYYY.MM` 或 `至今`、`id` 唯一性等）、核心结构 JSON 模板、常见错误与修复对照表。

- [ ] **步骤 2：运行测试验证通过**
  无直接单元测试，手动验证技能描述是否符合 `writing-skills` 规范。

- [ ] **步骤 3：Commit**
  ```bash
  git add .agents/skills/resume-json-builder/SKILL.md
  git commit -m "feat: 新增 AI 简历 JSON 构造技能，规范化 AI 生成数据格式"
  ```

---

### 任务 3：项目运行与构建验证

- [ ] **步骤 1：运行 Lint 校验**
  运行命令：`npm run lint`
  预期输出：所有 JavaScript/TypeScript 文件符合代码规范，无阻塞性错误。

- [ ] **步骤 2：运行 Build 校验**
  运行命令：`npm run build`
  预期输出：Next.js 项目成功打包构建。
