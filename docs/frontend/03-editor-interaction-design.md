# 编辑器交互设计

## 页面布局参数

| 区域 | 宽度建议 | 说明 |
| --- | --- | --- |
| 顶部工具栏 | `72px` 高 | 固定顶部，始终可见 |
| 左侧编辑区 | `420px` | 独立滚动 |
| 右侧预览区 | 剩余宽度 | 独立滚动，居中显示 A4 页面 |

## 顶部工具栏

拆分为以下组件：

| 组件 | 文件建议 | 责任 |
| --- | --- | --- |
| `TopToolbar` | `src/modules/resume-editor/components/toolbar/TopToolbar.tsx` | 统一布局和分组 |
| `LoginStatusButton` | `.../LoginStatusButton.tsx` | 显示登录状态，触发登录弹窗/登出菜单 |
| `ThemeColorPicker` | `.../ThemeColorPicker.tsx` | 切换主题色 |
| `TypographyControlGroup` | `.../TypographyControlGroup.tsx` | 调整字号、行高、段间距 |
| `ExportPdfButton` | `.../ExportPdfButton.tsx` | 调用导出流程、展示 loading 状态 |
| `SyncIndicator` | `.../SyncIndicator.tsx` | 显示“未保存/保存中/已同步/失败” |

## 左侧编辑区结构

```text
LeftPanel
  ├─ SectionNavigator
  └─ ResumeEditorAccordion
      ├─ BasicsSectionPanel
      ├─ EducationSectionPanel
      ├─ WorkSectionPanel
      ├─ ProjectSectionPanel
      ├─ SkillsSectionPanel
      └─ SummarySectionPanel
```

## 导航与折叠逻辑

- `SectionNavigator` 展示当前大模块顺序，并支持点击滚动到对应手风琴项。
- 大模块顺序由 `resume.sectionOrder` 驱动。
- `ResumeEditorAccordion` 的展开状态由 `expandedSections` 控制。
- 切换展开/收起时不清理表单内容。

## 大模块拖拽

### 实现要求

- 使用 `dnd-kit` 的 `SortableContext` 包裹大模块列表。
- 拖拽源为整个手风琴项头部。
- 成功拖拽后调用 `reorderSectionBlocks(active, over)` 更新 `sectionOrder`。
- 右侧预览以相同顺序渲染。

### 文件拆分

- `SectionSortableContainer.tsx`
- `SectionDragHandle.tsx`
- `useSectionOrderDnd.ts`

## 列表条目拖拽

教育、工作、项目、技能组都必须支持条目排序。

实现原则：

- 每种列表模块拥有独立的 sortable context。
- 列表项必须有稳定的 `id`，禁止使用数组下标。
- 拖拽结束只更新当前模块数组，不能重排整个 `sections` 对象。

## 表单组件拆分

### 通用原子组件

建议先实现以下基础组件，放在 `src/modules/resume-editor/components/forms/base/`：

- `TextField.tsx`
- `TextareaField.tsx`
- `MonthField.tsx`
- `TagInputField.tsx`
- `PanelCard.tsx`
- `IconButton.tsx`
- `EmptyState.tsx`

### 基本信息模块

文件建议：

- `forms/basics/BasicsSectionPanel.tsx`
- `forms/basics/BasicsForm.tsx`
- `forms/basics/BasicsPreviewFields.ts`

字段：

- 姓名
- 求职标题
- 手机
- 邮箱
- 城市
- 个人网站
- GitHub
- LinkedIn

规则：

- 邮箱与链接类字段实时校验，但只做弱提示，不阻止输入。
- 姓名为空时，预览区显示“你的名字”占位文本，避免页面塌陷。

### 教育经历模块

文件建议：

- `forms/education/EducationSectionPanel.tsx`
- `forms/education/EducationItemCard.tsx`
- `forms/education/EducationItemForm.tsx`

每条包含：

- 学校
- 专业
- 学历
- 起止时间
- 地点
- 补充描述

交互：

- 支持新增、删除、复制当前条目。
- 删除前若条目非空，弹出确认框。

### 工作经历模块

文件建议：

- `forms/work/WorkSectionPanel.tsx`
- `forms/work/WorkItemCard.tsx`
- `forms/work/WorkItemForm.tsx`
- `forms/work/MarkdownHelpPopover.tsx`

每条包含：

- 公司名
- 职位
- 起止时间
- 地点
- Markdown 描述

规则：

- 描述输入框右上角提供 Markdown 速查。
- `description` 默认按多行 textarea 输入，右侧预览实时解析。
- 支持项目符号、加粗、斜体、数字列表。

### 项目经历模块

与工作经历同构，复用大部分组件，仅字段改为项目名、角色、技术栈。

推荐拆出共享部件：

- `forms/experience/ExperienceTimelineHeader.tsx`
- `forms/experience/MarkdownEditorField.tsx`

### 技能与评价模块

技能和自我评价分成两个子卡片，但在预览侧仍归属于独立 section。

文件建议：

- `forms/skills/SkillsSectionPanel.tsx`
- `forms/skills/SkillGroupList.tsx`
- `forms/skills/SkillGroupCard.tsx`
- `forms/summary/SummarySectionPanel.tsx`

技能组字段：

- 组名，例如“编程语言”“框架”“工具”
- 标签数组

自我评价字段：

- Markdown 文本

## 表单校验策略

- 输入阶段不阻断，保存或导出前给出整体校验结果。
- 校验逻辑通过 `zod.safeParse(resume)` 统一执行。
- 错误呈现分两层：
  - 字段级：表单项下方红字提示。
  - 页面级：导出前 toast 汇总“不完整字段”。

## 交互反馈

| 场景 | UI 反馈 |
| --- | --- |
| 本地已修改未同步 | 工具栏显示“未保存” |
| 云端同步中 | 显示 loading 点和“保存中...” |
| 云端同步失败 | 显示错误图标，可点击重试 |
| PDF 导出中 | 下载按钮禁用并显示“生成中...” |
| 未登录尝试打开账号菜单 | 弹出登录弹窗 |

## 键盘与易用性

- 所有输入控件默认支持 Tab 顺序导航。
- `Ctrl/Cmd + S` 触发手动同步；未登录时退化为强制写入本地存储并提示。
- `Ctrl/Cmd + Enter` 在 Markdown 文本框中不做特殊提交，避免误操作。
