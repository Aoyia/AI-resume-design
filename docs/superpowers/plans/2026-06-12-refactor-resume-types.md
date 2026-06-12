# 简历类型定义微调重构实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 微调重构 `src/types/resume.ts`，将 `themeBackground` 属性重命名为 `enableTitleBg`，并简化 `createEmptyResume` 使其符合 DRY 原则。

**架构：** 通过重命名接口和常量中的属性名，并使用 ES6 展开运算符展开 `DEFAULT_THEME` 覆盖 `theme` 初始化代码，实现代码重构。

**技术栈：** TypeScript

---

### 任务 1：修改类型定义和常量，简化创建空简历函数

**文件：**
- 修改：`src/types/resume.ts`

- [ ] **步骤 1：修改 `ResumeTheme` 接口**
  把 `themeBackground?: boolean` 替换为 `enableTitleBg?: boolean`。

- [ ] **步骤 2：修改 `DEFAULT_THEME` 常量**
  把 `themeBackground: true` 替换为 `enableTitleBg: true`。

- [ ] **步骤 3：重构 `createEmptyResume` 中的 `theme` 属性**
  把硬编码的 `theme` 属性替换为：
  ```typescript
  theme: {
    ...DEFAULT_THEME,
  }
  ```

- [ ] **步骤 4：运行 TypeScript 类型检查**
  运行：`npx tsc --noEmit`
  预期：PASS（无类型报错）

- [ ] **步骤 5：提交修改**
  运行：
  ```bash
  git add src/types/resume.ts
  git commit -m "refactor: rename themeBackground to enableTitleBg and simplify createEmptyResume using DEFAULT_THEME"
  ```
