# 预览区与模板系统设计

## 目标

右侧预览必须完成三件事：

- 实时反映当前 `ResumeData`。
- 在浏览器里尽量模拟真实 A4 分页。
- 与打印页共用模板层，避免样式漂移。

## 核心组件

```text
ResumePreviewCanvas
  ├─ PreviewScaleToolbar
  ├─ VirtualPageList
  │   ├─ PreviewPage
  │   └─ PreviewPage
  └─ HiddenMeasureLayer
```

## 模板引擎

`src/modules/template/components/TemplateRenderer.tsx`

职责：

- 接收 `data: ResumeData`
- 接收 `mode: 'preview' | 'print'`
- 根据 `data.theme.templateId` 选择模板
- 将标准化 token 传给模板

接口建议：

```ts
export interface TemplateRendererProps {
  data: ResumeData;
  mode: 'preview' | 'print';
}
```

当前只实现：

- `DefaultResumeTemplate.tsx`

后续新增模板时只新增：

- 模板组件
- 模板样式
- 模板元数据映射

不修改 editor 或 store。

## 默认模板拆分

```text
default-template/
  DefaultResumeTemplate.tsx
  default-template.module.css
  sections/
    HeaderSection.tsx
    EducationSection.tsx
    WorkSection.tsx
    ProjectSection.tsx
    SkillsSection.tsx
    SummarySection.tsx
  primitives/
    SectionTitle.tsx
    TimelineItem.tsx
    MarkdownContent.tsx
```

## 预览分页策略

预览分页不直接依赖浏览器自然流，因为浏览器在普通滚动视图下无法稳定提供与打印完全一致的断页结果。前端需要显式做虚拟分页。

### 分页实现步骤

1. 以真实 A4 宽度在隐藏测量层完整渲染一份模板。
2. 为每个可分页块注册 `data-layout-block-id`。
3. 使用 `ResizeObserver` 或 `getBoundingClientRect()` 收集块高度。
4. 按 `pageInnerHeight` 将块打包到多个页面。
5. 将页面块数组传给 `VirtualPageList` 逐页渲染。

### 布局块粒度

建议以下对象作为最小分页块：

- `header`
- `section-title + first-item` 组合块
- `education-item`
- `work-item`
- `project-item`
- `skills-group`
- `summary-block`

这样可以避免标题掉到上一页末尾、内容跑到下一页的问题。

### 超长内容处理

工作经历和项目经历可能单条过长，必须支持二级切分。

处理规则：

- 先将 Markdown 描述按段落和列表切成 `contentChunks`。
- 若整条经历高度超过单页剩余空间，则重复渲染头部信息，把 `contentChunks` 分配到下一页。
- 拆分后的续页块在左上角展示较弱的“续”标记，避免阅读断裂。

对应工具函数建议：

- `layout/createLayoutBlocks.ts`
- `layout/measureBlocks.ts`
- `layout/paginateBlocks.ts`
- `layout/splitMarkdownBlocks.ts`

## A4 页面参数

| 参数 | 值 |
| --- | --- |
| 页面宽度 | `794px` |
| 页面高度 | `1123px` |
| 页面安全边距 | 由 `theme.pagePadding` 控制，默认 `56px` |

预览页面在视觉上允许缩放，但内部计算必须始终使用未缩放的真实尺寸。

## 预览与打印共享约束

- 模板 section 组件不能读取浏览器窗口信息。
- 字体、字号、间距、颜色统一来自主题 token。
- 打印模式下只关闭阴影、缩放和背景装饰，不重写版式结构。

共享 token 函数建议：

```ts
export interface TemplateTokens {
  primaryColor: string;
  headingFontSize: number;
  bodyFontSize: number;
  lineHeight: number;
  sectionGap: number;
  pagePadding: number;
}

export function buildTemplateTokens(theme: ResumeData['theme']): TemplateTokens;
```

## Markdown 渲染规则

- 仅允许常见文本标签：`p`、`strong`、`em`、`ul`、`ol`、`li`、`code`。
- 不允许原始 HTML 透传，避免预览和打印被注入不受控标签。
- 列表项间距在模板层统一控制，不能由浏览器默认样式决定。

## 预览性能

- 输入时先局部更新模板，再异步执行分页测量，避免打字卡顿。
- 使用 `requestAnimationFrame` 合并多次测量。
- 当用户连续输入 Markdown 时，可以延后 `150ms` 再重算分页。

## 空状态

- 当某个 section 数组为空时，预览默认不渲染该 section。
- 若所有内容几乎为空，保留 Header 与空白页面骨架，方便用户观察版式。
