# 免密纯内存编辑/预览模式切换设计规格书

本文档规定了简历编辑器访问控制模式的改动。在移除了密码校验的前提下，将默认展示状态改为纯预览模式，即用户每次访问该页面或刷新页面时，都默认只显示简历预览，只有当点击“编辑”按钮时才进入编辑面板。

## 背景与目的

在前一次重构中，系统去除了密码校验逻辑，使得所有用户都可以直接访问编辑器。但直接展示编辑面板破坏了“进入页面先展示纯净预览”的体验。

为了恢复并优化该体验，本设计旨在：
1. **默认进入预览模式**：用户首次打开页面或刷新页面时，隐藏左侧编辑面板与顶部工具栏，满屏显示简历预览。
2. **免密直接编辑**：用户点击预览页右上角的编辑按钮，直接展现编辑器和工具栏，无需输入密码。
3. **纯内存状态控制（方案 1）**：状态在页面刷新后重置为预览模式。

---

## 详细设计

### 1. 状态定义

在 `src/app/page.tsx` 中引入以下状态：
- `authorized`: 控制当前是否处于“编辑模式”，默认设为 `false`。

```typescript
const [authorized, setAuthorized] = useState(false);
```

由于默认值在服务器端和客户端渲染初始状态都是 `false`，从而完美避免了 Hydration 不匹配的报错问题，无需额外的加载等待状态。

### 2. 操作行为修改

- **开始编辑 (`handleStartEdit`)**：
  直接将 `authorized` 设为 `true`。
  ```typescript
  const handleStartEdit = () => {
    setAuthorized(true);
  };
  ```

- **锁定编辑并返回预览 (`handleLogout`)**：
  直接将 `authorized` 设为 `false`。
  ```typescript
  const handleLogout = () => {
    setAuthorized(false);
  };
  ```

### 3. DOM 渲染控制

- **工具栏 `Toolbar`**：
  仅在 `authorized` 为 `true` 时渲染。
  ```typescript
  {authorized && (
    <Toolbar 
      authorized={authorized} 
      onStartEdit={handleStartEdit} 
      onLogout={handleLogout} 
    />
  )}
  ```

- **左侧编辑面板 `aside`**：
  当 `authorized` 为 `false` 时，样式收紧为隐藏状态。通过 CSS `transition` 实现面板滑入滑出的丝滑过渡。
  ```typescript
  style={{ 
    width: authorized ? editorWidth : 0,
    opacity: authorized ? 1 : 0,
    visibility: authorized ? 'visible' : 'hidden',
    transition: 'width 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s'
  }}
  ```

- **可拖拽分割条 `resizer`**：
  仅在 `authorized` 时渲染。
  ```typescript
  {authorized && (
    <div
      ref={resizerRef}
      onMouseDown={onMouseDown}
      className="..."
      title="拖动以调整面板宽度"
    >
      ...
    </div>
  )}
  ```

- **右侧预览面板 `PreviewPanel`**：
  传入 `authorized` 属性，用于控制右上角悬浮“编辑”按钮的显隐。
  ```typescript
  <PreviewPanel 
    authorized={authorized} 
    onStartEdit={handleStartEdit} 
  />
  ```

---

## 验证计划

1. **首次访问/刷新验证**：
   - 打开页面或刷新页面。
   - 预期结果：页面满屏展示 A4 预览，无顶部工具栏，左侧无编辑面板。右上方显示悬浮编辑按钮。
2. **进入编辑验证**：
   - 点击预览面板右上方的悬浮编辑按钮。
   - 预期结果：无需密码，左侧编辑面板向右平滑展开，顶部工具栏显现，右上方悬浮按钮消失。
3. **退出编辑验证**：
   - 点击工具栏右上角的退出编辑（注销）按钮。
   - 预期结果：弹出“确定要锁定编辑吗？”确认框，点击确定后，左侧编辑面板收起，顶部工具栏隐藏。
