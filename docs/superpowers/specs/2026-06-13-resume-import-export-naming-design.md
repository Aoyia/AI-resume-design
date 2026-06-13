# 简历导入与导出命名规则设计说明书

本项目旨在优化简历在导入和导出 JSON 数据时的文件命名及重名处理规则，解决先前版本中导出文件名带有额外后缀、导入文件名被强制追加 ` (导入)` 等影响用户体验的问题。

## 需求背景
1. **导出时**：导出 JSON 数据的文件名应该与简历列表中的简历名一致，不应额外添加 `_配置` 等后缀。
2. **导入时**：导入 JSON 数据时，不应强制添加 ` (导入)` 等前后缀。如果遇到同名简历，则通过追加自增的括号数字（如 ` (1)`、` (2)`）进行重名处理；若无重名，则保留原名。

## 详细方案设计

### 1. 导出文件名优化
文件：[Toolbar.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/editor/Toolbar.tsx)
- 在 `handleExportCurrent` 方法中：
  - 提取简历基本名称：
    ```typescript
    const name = resume.resumeName || resume.basicInfo.name || '我的简历';
    ```
  - 设置下载文件名：
    ```typescript
    a.download = `${name}.json`;
    ```
  （去除了先前拼接的 `_配置.json` 后缀）

### 2. 导入重名与命名清洗
文件：[useResumeStore.ts](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/store/useResumeStore.ts)

- **唯一性命名算法**：
  新增辅助方法 `getUniqueResumeName(existingNames: string[], baseName: string): string`
  ```typescript
  const getUniqueResumeName = (existingNames: string[], baseName: string): string => {
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    let counter = 1;
    let uniqueName = `${baseName} (${counter})`;
    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName} (${counter})`;
    }
    return uniqueName;
  };
  ```

- **单份简历导入** `importSingleResume`：
  - 提取基础名 `const baseName = data.resumeName || data.basicInfo?.name || '未命名';`
  - 获取当前所有的简历名称：`const existingNames = s.resumes.map(r => r.resumeName || '');`
  - 计算唯一名称：`const finalName = getUniqueResumeName(existingNames, baseName);`
  - 设置 `imported.resumeName = finalName;`（去除了原先的 ` (导入)` 后缀）

- **批量备份包导入** `importBackupPackage`：
  - 如果为覆盖模式（`override === true`），则将现存名字池 `existingNames` 初始化为空列表；否则初始化为 `s.resumes.map(r => r.resumeName || '')`
  - 遍历待导入简历：
    - 提取基础名 `baseName`
    - 计算唯一名称 `finalName = getUniqueResumeName(existingNames, baseName)`
    - 将 `finalName` 追加到 `existingNames` 中，以防止包内或包外导入出现重名冲突
    - 设置简历名称为 `finalName`
  - 覆盖模式时，如果原始备份数据中缺失 `resumeName`，不再强行加 `_简历` 后缀。

### 3. 长简历名称截断气泡提示
文件：[Toolbar.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/editor/Toolbar.tsx)
- 从 `@arco-design/web-react` 引入 `Tooltip` 组件。
- 包裹简历管理列表中渲染简历名称的节点，使名字太长时（采用 CSS 的 `truncate` 类截断），鼠标悬停能通过 `Tooltip` 气泡展示完整文字。
  ```typescript
  <Tooltip content={r.resumeName || r.basicInfo.name || '未命名'}>
    <div className="text-xs font-bold text-slate-700 truncate leading-snug">
      {r.resumeName || r.basicInfo.name || '未命名'}
    </div>
  </Tooltip>
  ```

## 验证计划
1. **导出验证**：
   - 在应用内导出当前简历，检查下载下来的文件名是否为 `[简历名].json`。
2. **导入无重名验证**：
   - 导入一份名称不存在的简历 JSON，确认导入后简历列表中显示的名称与原简历名完全一致，无多余前后缀。
3. **导入重名验证**：
   - 再次导入同名简历 JSON，确认其名称被自动重命名为 `[简历名] (1)`。
   - 连续导入第三次，确认其名称被重命名为 `[简历名] (2)`。
4. **悬停气泡验证**：
   - 确认在简历列表中，较长名字显示为缩略省略号，且鼠标悬停时会弹出 Arco 的 Tooltip 气泡，展现完整字样。
