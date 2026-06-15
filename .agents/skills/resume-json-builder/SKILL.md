---
name: resume-json-builder
description: 在为 AI-resume-design 应用生成、修改或校验可导入的结构化简历 JSON 数据时使用。
---

# 简历 JSON 数据构建与校验技能

## 概述

本技能用于指导 AI 助手如何针对 `AI-resume-design` 简历项目，生成、格式化和校验 100% 符合其 TypeScript 类型（`ResumeData`）定义的结构化 JSON 简历数据。从而避免因数据字段格式错误导致在网页导入时发生解析崩溃。

---

## 何时使用

*   当用户要求您将自然语言描述的个人履历（或零散经历）转换成该项目可一键导入的 JSON 数据时。
*   当用户需要您直接修改或优化其已有的简历 JSON 文件时。
*   当导入简历 JSON 报错，需要您定位格式并进行修复校验时。

---

## 核心模式与强约束

为确保生成的 JSON 能够成功解析，您**必须**严格遵守以下底层数据类型约束：

### 1. skills 字段（专业技能）—— 极易犯错点
在本项目中，`skills` 字段是一个**包含换行符 `\n` 的单个 Markdown 格式字符串**，它负责控制整个技能面板的渲染。
*   ❌ **绝对不能**写成 String 数组（如 `["React", "Vue"]`）。
*   ✔️ **必须**写成换行 Markdown 字符串（如 `"- 熟练掌握 React 框架...\n- 熟悉 Webpack 构建..."`）。

### 2. 日期格式约束
所有的历程时间（如教育、工作、项目经历中的 `startDate` 和 `endDate`）必须遵循以下标准：
*   格式为：`YYYY.MM` 或 `至今`（例如 `2022.06`、`2026.05`、`至今`）。
*   ❌ **严禁**使用中文的“年”、“月”或特殊连接符（如 `2022年6月`、`2022-06`、`2022/06`）。

### 3. id 字段唯一性
*   简历数据根级以及每个数组项（`workExperience`、`projects`、`education` 等历程中的子项）都必须有唯一的 `id` 属性。
*   您可以使用简短且不重复的字符串作为 ID，例如 `work-1`、`proj-1`、`edu-1`。

### 4. 排序控制与自定义标题
*   必须在 JSON 根级包含 `sectionOrder` 数组，它指定了各大模块在前台渲染的先后顺序（可选的 Key 包括：`basicInfo`、`skills`、`projects`、`workExperience`、`education` 等）。
*   `customTitles`（自定义模块标题映射）必须为对象结构（若无自定义则为空对象 `{}`）。

### 5. Markdown 语法支持
部分描述字段支持标准 Markdown 语法（如加粗 `**`、无序列表 `-` 等），请在此类字段中合理排版以美化前台展现：
*   工作/项目经历的 `description` 字段。
*   自定义模块 `customSections` 的 `content` 字段。
*   自我评价 `selfEvaluation` 字段。

---

## 核心 JSON 模板规范

当您输出 JSON 时，请直接输出如下干净、合法的 JSON 代码块（请勿包裹多余的解释文本）：

```json
{
  "id": "yang-zhong-yuan-demo-id",
  "resumeName": "张三_简历",
  "customTitles": {},
  "theme": {
    "templateId": "classic",
    "primaryColor": "#2563EB",
    "fontFamily": "Noto Sans SC",
    "fontSize": 14,
    "lineHeight": 1.6,
    "sectionGap": 12,
    "dividerStyle": "skew-block",
    "dividerHeight": 3
  },
  "basicInfo": {
    "name": "张三",
    "jobTitle": "前端开发工程师",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "location": "上海",
    "website": "github.com/zhangsan"
  },
  "education": [
    {
      "id": "edu-1",
      "school": "华东交通大学",
      "major": "软件工程",
      "degree": "本科",
      "startDate": "2018.09",
      "endDate": "2022.07",
      "description": ""
    }
  ],
  "workExperience": [
    {
      "id": "work-1",
      "company": "上海得帆智能科技有限公司",
      "position": "前端研发工程师",
      "startDate": "2022.06",
      "endDate": "2026.05",
      "description": "1. 负责低代码平台高复杂度模块研发，持续进行组件化重构与性能调优。\n2. 负责前端团队工程化建设与效能提升。"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "company": "得帆云低代码平台",
      "position": "核心开发",
      "startDate": "2022.06",
      "endDate": "2026.05",
      "description": "**项目简介**：企业级低代码应用开发平台。\n\n**技术栈**：Vue 3 + TypeScript + Webpack\n\n**核心贡献**：\n- **性能优化**：建立字段依赖图，结合防抖批处理，提升渲染性能。"
    }
  ],
  "skills": "- 熟练运用 **React** / **Vue 3** 核心机制与全家桶。\n- 深入掌握 **JavaScript** 基础与 **TypeScript** 语言规范。\n- 熟练掌握 **Webpack** / **Vite** 等主流构建工具的优化配置。",
  "selfEvaluation": "热爱技术，具备良好的自驱力与团队协作精神。",
  "customSections": [],
  "sectionOrder": [
    "basicInfo",
    "skills",
    "projects",
    "workExperience",
    "education"
  ]
}
```

---

## 常见错误与修正对照表

| 常见错误原因 | ❌ 错误示例 | ✔️ 正确修正 |
| :--- | :--- | :--- |
| **将 skills 错写为数组** | `"skills": ["React", "Vue", "TS"]` | `"skills": "- 熟练使用 React\n- 掌握 Vue\n- 精通 TS"` |
| **日期格式包含中文** | `"startDate": "2022年06月"` | `"startDate": "2022.06"` |
| **日期连接符错误** | `"endDate": "2026-05"` | `"endDate": "2026.05"` |
| **经历项漏掉唯一 id** | `{"company": "A公司", "position": "前端"}` | `{"id": "work-1", "company": "A公司", "position": "前端"}` |
| **漏填 sectionOrder 数组** | 根级缺少 `"sectionOrder"` 属性 | 必须在根级提供如上模板所示的展示顺序数组 |
