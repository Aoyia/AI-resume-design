# 替换系统弹窗为 Arco 弹窗实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 查看代码中所有使用了系统 `alert` 弹窗和 `confirm` 确认弹窗的地方，替换为 Arco Design 的 `Message` 和 `Modal` 弹窗。

**架构：**
- 将单向的提示 `alert(...)` 替换为 `Message.success(...)`、`Message.error(...)` 或 `Message.warning(...)`。
- 将确认逻辑 `if (confirm(...))` 替换为 `Modal.confirm({ ... })` 的异步回调形式，确保样式统一并保持正确的逻辑流。
- 优化备份包导入的选择机制，将原来只能在“覆盖”和“合并追加”二选一的同步 confirm 改造成使用自定义 `footer` 的 `Modal.confirm`，提供“覆盖本地”、“合并追加”和“取消导入”三个按钮选项。

**技术栈：** React, Next.js, Arco Design (`@arco-design/web-react`)

---

### 任务 1：替换 BasicInfoForm 中的 alert
**文件：**
- 修改：`src/components/editor/BasicInfoForm.tsx`

- [ ] **步骤 1：导入 Message 并替换 alert**
  将 `BasicInfoForm.tsx` 中的 `alert('请上传图片文件');` 替换为 `Message.error('请上传图片文件');`。

- [ ] **步骤 2：测试与验证**
  在浏览器上打开修改后的 BasicInfoForm，上传非图片格式文件，验证是否成功触发 Arco Message 错误提示。

- [ ] **步骤 3：Commit 更改**
  ```bash
  git add src/components/editor/BasicInfoForm.tsx
  git commit -m "refactor: replace alert with Arco Message in BasicInfoForm"
  ```

---

### 任务 2：替换 PreviewPanel 中的 alert
**文件：**
- 修改：`src/components/editor/PreviewPanel.tsx`

- [ ] **步骤 1：导入 Message 并替换 alert**
  在 `PreviewPanel.tsx` 中导入 `Message`：
  ```typescript
  import { Message } from '@arco-design/web-react';
  ```
  替换 `alert('PDF 生成失败，请稍后重试');` 为 `Message.error('PDF 生成失败，请稍后重试');`。
  替换 `alert('图片生成失败，请稍后重试');` 为 `Message.error('图片生成失败，请稍后重试');`。

- [ ] **步骤 2：测试与验证**
  检查 PreviewPanel 中点击下载 PDF 或图片失败时的逻辑，确认代码没有语法错误，且能正确弹出 Arco Message 提示。

- [ ] **步骤 3：Commit 更改**
  ```bash
  git add src/components/editor/PreviewPanel.tsx
  git commit -m "refactor: replace alert with Arco Message in PreviewPanel"
  ```

---

### 任务 3：替换 page.tsx 中的 confirm 弹窗
**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：导入 Modal 并替换 confirm**
  在 `src/app/page.tsx` 中导入 `Modal`：
  ```typescript
  import { Modal } from '@arco-design/web-react';
  ```
  将 `handleLogout` 中的同步 `confirm` 更改为异步 `Modal.confirm`：
  ```typescript
  const handleLogout = () => {
    Modal.confirm({
      title: '确认提示',
      content: '确定锁定编辑模式并切回纯净预览？本地草稿不会丢失。',
      onOk: () => {
        localStorage.removeItem('resume_sys_auth');
        setAuthorized(false);
      }
    });
  };
  ```

- [ ] **步骤 2：测试与验证**
  运行应用，在开启编辑模式后点击“切回预览/锁定”按钮，触发确认对话框，点击“确定”应当成功切回预览；点击“取消”或背景遮罩应安全保留。

- [ ] **步骤 3：Commit 更改**
  ```bash
  git add src/app/page.tsx
  git commit -m "refactor: replace confirm with Arco Modal.confirm in page.tsx"
  ```

---

### 任务 4：替换 Toolbar.tsx 中的 alert 和删除/重置 confirm
**文件：**
- 修改：`src/components/editor/Toolbar.tsx`

- [ ] **步骤 1：导入 Modal 和 Message 并更新删除与重置 confirm 逻辑**
  在 `Toolbar.tsx` 的 `@arco-design/web-react` 导入行中添加 `Modal` 和 `Message`。
  替换 `handleDelete` 中的 `confirm`：
  ```typescript
  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '删除简历确认',
      content: `确定删除简历“${name || '未命名'}”吗？此操作不可撤销。`,
      okButtonProps: { status: 'danger' },
      onOk: () => {
        deleteResume(id);
        Message.success('简历删除成功');
      }
    });
  };
  ```
  替换重置简历按钮的点击事件 `confirm`（第243行）：
  ```typescript
  Modal.confirm({
    title: '重置简历确认',
    content: '确定重置所有内容？此操作将清空当前简历的所有编辑内容，且无法撤销。',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      resetResume();
      Message.success('简历内容已重置');
    }
  });
  ```

- [ ] **步骤 2：替换 Toolbar.tsx 中的其他单向 alert 提示**
  把所有其他的 `alert`（如导出成功/失败提示、单份简历导入成功提示、格式错误提示）全部替换为 `Message.success` 或 `Message.error`。

- [ ] **步骤 3：测试与验证**
  检查删除简历、重置简历、导出简历等功能，确认提示和确认框正常弹出，且没有逻辑遗漏。

- [ ] **步骤 4：Commit 更改**
  ```bash
  git add src/components/editor/Toolbar.tsx
  git commit -m "refactor: replace alert and regular confirms in Toolbar"
  ```

---

### 任务 5：替换并优化 Toolbar.tsx 中的备份包导入 confirm 逻辑
**文件：**
- 修改：`src/components/editor/Toolbar.tsx`

- [ ] **步骤 1：重写备份包导入的 confirm 逻辑为自定义 footer 的 Modal.confirm**
  在 `handleImportFile` 中，将：
  ```typescript
  if (parsed.type === 'resume-backup-package' && Array.isArray(parsed.resumes)) {
    const action = confirm(
      `检测到备份包中含有 ${parsed.resumes.length} 份简历。\n点击“确定”将覆盖本地所有简历，点击“取消”将合并追加到当前列表。`
    );
    importBackupPackage(parsed.resumes, action);
    alert(action ? '已成功覆盖恢复所有简历！' : '已成功合并追加简历列表！');
  }
  ```
  改写为：
  ```typescript
  if (parsed.type === 'resume-backup-package' && Array.isArray(parsed.resumes)) {
    Modal.confirm({
      title: '导入备份确认',
      content: `检测到备份包中含有 ${parsed.resumes.length} 份简历。请选择您的导入方式：`,
      footer: (okAnchor, cancelAnchor) => {
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => Modal.destroyAll()}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
            >
              取消导入
            </button>
            <button
              onClick={() => {
                importBackupPackage(parsed.resumes, false);
                Message.success('已成功合并追加简历列表！');
                Modal.destroyAll();
              }}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer border border-indigo-200/50 bg-transparent"
            >
              合并追加列表
            </button>
            <button
              onClick={() => {
                importBackupPackage(parsed.resumes, true);
                Message.success('已成功覆盖恢复所有简历！');
                Modal.destroyAll();
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer border-0"
            >
              覆盖本地简历
            </button>
          </div>
        );
      }
    });
  }
  ```

- [ ] **步骤 2：测试与验证**
  上传一个备份包格式的文件，验证导入多选弹窗的行为：
  - 点击“覆盖本地简历”，验证本地简历已被完全覆盖恢复；
  - 点击“合并追加列表”，验证本地简历未被删除，备份简历被追加到列表中；
  - 点击“取消导入”，验证导入被终止，且本地简历无变化。

- [ ] **步骤 3：Commit 更改**
  ```bash
  git add src/components/editor/Toolbar.tsx
  git commit -m "refactor: optimize backup import package confirm using custom Modal footer"
  ```
