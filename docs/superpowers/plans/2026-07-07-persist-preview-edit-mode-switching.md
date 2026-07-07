# 免密纯内存编辑/预览模式切换 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现免密模式下，默认展示纯预览模式（隐藏左侧面板及顶部工具栏），点击编辑直接进入编辑，刷新后恢复预览模式。

**架构：** 在 `src/app/page.tsx` 中引入 `authorized` 状态，默认值为 `false`。通过 `authorized` 隐藏/显示编辑面板、工具栏与分割条，不再操作 LocalStorage。

**技术栈：** React Hooks (useState), CSS Transitions.

---

### 任务 1：重构 `src/app/page.tsx` 页面控制流

**文件：**
- 修改：`src/app/page.tsx` (主要是状态控制、渲染控制)

- [ ] **步骤 1：重构状态定义**
  
  修改原本写死的 `const authorized = true;`。引入 `authorized` 状态。
  
  原代码：
  ```typescript
  const authorized = true;
  ```
  
  替换为：
  ```typescript
  const [authorized, setAuthorized] = useState(false);
  ```

- [ ] **步骤 2：重构切换事件函数**
  
  重构 `handleStartEdit` 和 `handleLogout` 以直接更新内存状态。
  
  原代码：
  ```typescript
  const handleStartEdit = () => {
    // 无密码保护，直接进入编辑
  };

  const handleLogout = () => {
    // 无需注销逻辑
  };
  ```
  
  替换为：
  ```typescript
  const handleStartEdit = () => {
    setAuthorized(true);
  };

  const handleLogout = () => {
    setAuthorized(false);
  };
  ```

- [ ] **步骤 3：修改组件与面板的条件渲染**
  
  修改 Toolbar、aside 编辑面板、resizer 分割线、PreviewPanel 的渲染逻辑，使用 `authorized`。
  
  - 1) 仅在 `authorized` 时渲染 `Toolbar`：
    ```typescript
    {authorized && (
      <Toolbar 
        authorized={authorized} 
        onStartEdit={handleStartEdit} 
        onLogout={handleLogout} 
      />
    )}
    ```
  - 2) 隐藏/展示 aside 面板的宽度、透明度及可见度：
    ```typescript
    style={{ 
      width: authorized ? editorWidth : 0,
      opacity: authorized ? 1 : 0,
      visibility: authorized ? 'visible' : 'hidden',
      transition: 'width 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s'
    }}
    ```
  - 3) 仅在 `authorized` 时渲染可拖拽分割条：
    ```typescript
    {authorized && (
      <div
        ref={resizerRef}
        onMouseDown={onMouseDown}
        className="group relative w-1 shrink-0 bg-[var(--border)] hover:bg-[var(--primary)] transition-colors duration-150 cursor-col-resize z-10 flex items-center justify-center"
        title="拖动以调整面板宽度"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col gap-0.5 pointer-events-none">
          <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
          <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
        </div>
      </div>
    )}
    ```
  - 4) 将授权状态传入 `PreviewPanel`：
    ```typescript
    <PreviewPanel 
      authorized={authorized} 
      onStartEdit={handleStartEdit} 
    />
    ```

- [ ] **步骤 4：Commit 本次修改**
  
  ```bash
  git add src/app/page.tsx
  git commit -m "feat(auth): support passwordless preview/edit mode switching"
  ```
