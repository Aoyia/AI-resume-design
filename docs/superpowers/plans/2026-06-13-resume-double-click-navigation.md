# 双击简历内容导航至左侧配置模块 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标**：在双击右侧简历内容时，自动展开左侧配置栏的对应折叠面板，并平滑滚动到该模块视图中，同时清除双击选区。

**架构**：
1. 在全局 Zustand 状态库中使用一个排他性的 `activeSection` 临时状态，不参与 LocalStorage 状态的持久化。
2. 改造折叠面板 `Accordion` 组件以支持受控的 `open` 和 `onOpenChange`。
3. 利用 React 克隆技术，使 `ClassicTemplate` 能够给所有子元素注入 `data-section` 属性，并通过事件委托捕获双击事件，更新 `activeSection` 状态。
4. `EditorPanel` 中的各模块检测 `activeSection` 的激活状态，控制其自身 `Accordion` 的展开，并使用 `useEffect` 配合 `scrollIntoView` 定位到对应节点。

**技术栈**：React 18, Zustand, Next.js 14, DOM API (scrollIntoView, getSelection)

---

### 任务 1：全局状态扩展与受控控制

**文件**：
- 修改：`src/store/useResumeStore.ts`

- [ ] **步骤 1：在 store 接口中加入类型定义**

```typescript
// ─── Store 接口定义 ────────────────────────────────────────
interface ResumeStore {
  // ... 其他代码不变
  activeSection: SectionKey | null;
  setActiveSection: (key: SectionKey | null) => void;
}
```

- [ ] **步骤 2：在 store 内部初始化 activeSection 与其 setter**

```typescript
export const useResumeStore = create<ResumeStore>()(
  persist(
    syncResumesMiddleware((set) => ({
      resume: createEmptyResume(),
      pages: [],
      setPages: (pages) => set({ pages }),
      activeSection: null,
      setActiveSection: (activeSection) => set({ activeSection }),
      // ... 其他代码不变
```

- [ ] **步骤 3：在 persist 中排除 activeSection 状态**

确保此 UI 交互的临时聚焦状态不会被序列化到 `localStorage` 中。
```typescript
      partialize: (state) => {
        const { pages, activeSection, setActiveSection, ...rest } = state;
        return rest;
      },
```

- [ ] **步骤 4：Commit**

```bash
git add src/store/useResumeStore.ts
git commit -m "feat: add activeSection state to resume store"
```

---

### 任务 2：重构折叠面板组件以支持外部受控模式

**文件**：
- 修改：`src/components/ui/Accordion.tsx`

- [ ] **步骤 1：扩展 AccordionProps 接口以支持受控属性**

```typescript
interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
  dragHandle?: ReactNode;
  onTitleChange?: (newTitle: string) => void;
  open?: boolean; // 新增：受控展开状态
  onOpenChange?: (open: boolean) => void; // 新增：折叠展开回调
}
```

- [ ] **步骤 2：在组件内部适配受控/半受控展开逻辑**

使用 props 的 `open` 属性作为最终展开判断，若无传入则使用本地的 `isOpenState`；在点击标题栏时调用回调并决定如何修改内部/外部状态。
```typescript
export default function Accordion({
  title,
  defaultOpen = true,
  className,
  children,
  action,
  dragHandle,
  onTitleChange,
  open: controlledOpen,
  onOpenChange,
}: AccordionProps) {
  const [isOpenState, setIsOpenState] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(title);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpened = controlledOpen !== undefined ? controlledOpen : isOpenState;

  const handleToggle = () => {
    const nextState = !isOpened;
    if (controlledOpen === undefined) {
      setIsOpenState(nextState);
    }
    onOpenChange?.(nextState);
  };
```

并将 `Accordion.tsx` 里的 `setOpen((v) => !v)` 改为 `handleToggle()`，并将所有引用内部 `open` 状态的地方改为引用 `isOpened`。

- [ ] **步骤 3：Commit**

```bash
git add src/components/ui/Accordion.tsx
git commit -m "refactor: support controlled mode in Accordion component"
```

---

### 任务 3：在简历模板中标记模块并捕获双击事件

**文件**：
- 修改：`src/components/templates/ClassicTemplate.tsx`

- [ ] **步骤 1：重构 getFlatElements，通过克隆注入 data-section 属性**

在 `getFlatElements` 函数内部，引入一个统一拼接 `data-section` 的克隆函数：
```typescript
export function getFlatElements(data: ResumeData): React.ReactElement[] {
  const {
    theme, basicInfo: b, education, workExperience, projects, skills, selfEvaluation, sectionOrder,
    // ... 其他声明不变
  } = data;
  const color = theme.primaryColor;
  const gap = theme.sectionGap;

  const elements: React.ReactElement[] = [];

  // 1. 头部：基本信息 (索引 0) 显式增加 data-section 标记
  elements.push(
    <div
      key="basic-info-header"
      data-type="basic-info"
      data-section="basicInfo"
      data-cache-key={`basic-info|${b.name}|${b.jobTitle}|${b.phone}|${b.email}|${b.location}|${b.website}|${b.avatar}|${theme.fontSize}|${theme.lineHeight}|${theme.fontFamily}`}
      className="mb-2 flex justify-between items-start gap-6"
    >
      {/* 内部代码不变 */}
    </div>
  );

  let isFirstSection = true;

  // 2. 根据模块排序依次放入扁平节点
  sectionOrder.forEach((key) => {
    if (key === 'basicInfo') return;

    // 声明用于自动注入 data-section 的辅助克隆方法
    const pushWithSection = (el: React.ReactElement) => {
      elements.push(React.cloneElement(el, { 'data-section': key }));
    };

    // 当前模块是否有内容
    let hasContent = false;
    // ...
```
接下来，将 `sectionOrder.forEach` 内部的所有直接的 `elements.push(<...>)` 替换为 `pushWithSection(<...>)`。

- [ ] **步骤 2：在 ClassicTemplate 中捕获双击事件**

在 `ClassicTemplate` 根容器上绑定双击事件监听：
1. 向上查询具有 `data-section` 属性的 DOM 节点。
2. 过滤掉预览模式（未登录，即 `onStartEdit` 被传入时不需要响应）。
3. 调用 `setActiveSection(sectionKey)`。
4. 清除浏览器双击自动生成的文字选中。

```typescript
export default function ClassicTemplate({ data, elementIndices, onStartEdit }: ClassicTemplateProps) {
  const flatElements = getFlatElements(data);
  const fontFamilyValue = FONT_FALLBACKS[data.theme.fontFamily] || data.theme.fontFamily;
  const setActiveSection = useResumeStore((s) => s.setActiveSection);

  const renderedElements = elementIndices
    ? elementIndices.map((idx) => flatElements[idx] || null)
    : flatElements;

  const handleDoubleClick = (e: React.MouseEvent) => {
    // 仅在编辑模式下触发（未授权预览时 onStartEdit 会存在，不需要响应双击定位）
    if (onStartEdit) return;

    const target = e.target as HTMLElement;
    const sectionEl = target.closest('[data-section]');
    if (sectionEl) {
      const sectionKey = sectionEl.getAttribute('data-section') as SectionKey;
      if (sectionKey) {
        setActiveSection(sectionKey);
        // 清除选区，提升交互品质
        window.getSelection()?.removeAllRanges();
      }
    }
  };

  return (
    <div
      className="w-full h-full bg-white text-gray-800 break-all tracking-wide"
      style={{
        fontFamily: fontFamilyValue,
        fontSize: `${data.theme.fontSize}px`,
        lineHeight: data.theme.lineHeight,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* 内部渲染代码不变 */}
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/templates/ClassicTemplate.tsx
git commit -m "feat: inject data-section tags and bind double-click delegate"
```

---

### 任务 4：左侧配置栏滚动与手风琴展开联动

**文件**：
- 修改：`src/components/editor/EditorPanel.tsx`

- [ ] **步骤 1：在 SortableSection 中绑定手风琴与定位逻辑**

在 `SortableSection` 内部获取 `activeSection` 与 `setActiveSection`，把 Accordion 变为受控组件，并利用 `id` 与 `useEffect` 实现平滑滚动。
```typescript
function SortableSection({ id }: { id: SectionKey }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const removeSectionFromOrder = useResumeStore((s) => s.removeSectionFromOrder);
  const customTitles = useResumeStore((s) => s.resume.customTitles);
  const updateSectionTitle = useResumeStore((s) => s.updateSectionTitle);

  // 获取状态与更新方法
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);

  const isCurrentActive = activeSection === id;

  // 定位到该模块的平滑滚动
  useEffect(() => {
    if (isCurrentActive) {
      // 稍微延迟（150ms），确保 Accordion 展开高度变化稳定
      const timer = setTimeout(() => {
        const el = document.getElementById(`editor-section-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isCurrentActive, id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // ... dragHandle, title, renderContent 逻辑保持不变

  return (
    <div
      ref={setNodeRef}
      id={`editor-section-${id}`} // 新增唯一标识
      style={style}
      className={cn(
        "transition-all duration-200 rounded-[var(--radius-md)]",
        isDragging && "scale-[1.02] shadow-2xl ring-1 ring-[var(--primary)]/20 z-50 bg-white"
      )}
    >
      <Accordion
        title={title}
        open={isCurrentActive} // 手风琴受控模式
        onOpenChange={(openState) => {
          setActiveSection(openState ? id : null);
        }}
        dragHandle={isFixed ? undefined : dragHandle}
        action={action}
        onTitleChange={(newTitle) => updateSectionTitle(id, newTitle)}
      >
        {renderContent()}
      </Accordion>
    </div>
  );
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/editor/EditorPanel.tsx
git commit -m "feat: link activeSection to Accordion state and enable smooth scrollIntoView"
```

---

## 4. 手动验证方案

1. 启动本地开发服务器并登录到简历编辑界面。
2. 展开左侧多个模块折叠，并在右侧双击“专业技能”的内容块：
   - **预期效果**：左侧只有“基本信息”和“专业技能”展开，其他模块自动被折叠收起。
   - **预期效果**：左侧“专业技能”模块平滑滚动至滚动容器的顶部。
   - **预期效果**：被双击的内容文字不会被高亮选中（没有蓝色选区）。
3. 接着在右侧双击“项目经历”中的任意描述文字：
   - **预期效果**：左侧“专业技能”收起，“项目经历”展开，并自动平滑向上滚动显示。
