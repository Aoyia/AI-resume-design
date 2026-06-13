# 双击简历内容导航至左侧配置模块设计文档

本文档描述了双击右侧简历预览内容时，左侧配置栏自动展开对应模块并平滑定位的交互实现方案。

## 1. 目标与交互设计
* **触发机制**：当用户在已授权的编辑状态下，双击（`double click`）右侧简历页面的任何文字或区块。
* **左侧响应（手风琴排他展开）**：左侧编辑栏中对应的配置模块折叠面板（`Accordion`）自动展开，其他模块折叠面板全部收起。
* **平滑滚动定位**：被展开的配置模块平滑滚动（`scrollIntoView`）至左侧滚动容器的可视区域顶部。
* **体验优化**：在双击触发定位时，清除因双击产生的文本蓝色高亮选中区域，提升操作的流畅感与品质感。

## 2. 详细设计与代码变动

### 2.1. 全局状态扩展 - `useResumeStore.ts`
在全局 ResumeStore 状态中引入一个用于记录当前处于“聚焦/展开”状态的模块 Key：
* **新增状态**：`activeSection: SectionKey | null`
* **新增操作方法**：`setActiveSection: (key: SectionKey | null) => void`
* **持久化隔离**：在 `persist` 中间件的 `partialize` 中过滤掉 `activeSection` 字段，使其只在内存中生效，刷新页面重置。

### 2.2. 折叠面板受控增强 - `Accordion.tsx`
使 `Accordion` 支持完全/半受控模式，允许从外部父组件控制其折叠与展开状态：
* **新增 Props**：
  * `open?: boolean` (可选，外部控制状态)
  * `onOpenChange?: (open: boolean) => void` (可选，状态改变回调)
* **状态协调**：如果传入了 `open` 属性，则以 `open` 属性为主；否则使用内部的 `isOpenState`。

### 2.3. 简历模板元素标记与双击委托 - `ClassicTemplate.tsx`
如何高效、侵入性低地识别被双击元素对应的模块：
* **注入 section 标记**：
  * 修改 `getFlatElements` 辅助函数。在遍历 `sectionOrder` 时，声明一个辅助函数 `pushWithSection = (el) => React.cloneElement(el, { 'data-section': key })`。
  * 将 `sectionOrder.forEach` 内部所有的 `elements.push(...)` 替换为 `pushWithSection(...)`。
  * 对于顶部的基本信息，直接在根元素的 div 上挂载 `data-section="basicInfo"`。
* **事件委托与双击拦截**：
  * 在 `ClassicTemplate` 根组件的容器 `div` 上绑定 `onDoubleClick`。
  * 双击时：
    1. 通过 `const target = e.target as HTMLElement`，向上查找到最近的 `closest('[data-section]')`。
    2. 获取到该元素的 `sectionKey`（即 `data-section` 的属性值）。
    3. 调用 `setActiveSection(sectionKey)`。
    4. 执行 `window.getSelection()?.removeAllRanges()` 消除文本高亮选区。

### 2.4. 滚动定位联动 - `EditorPanel.tsx`
左侧折叠面板列表如何滚入可视区：
* **唯一标识**：在 `SortableSection` 渲染的最外层元素上，绑定 `id={`editor-section-${id}`}`。
* **滚动定位监听**：
  * 在 `SortableSection` 中，使用 `useEffect` 监听 `activeSection` 变量。
  * 当 `activeSection === id` 时，设置一个 `150ms` 的延时定时器（保证 Accordion 的展开动画已经启动，元素高度已被拉伸），然后执行：
    ```typescript
    const el = document.getElementById(`editor-section-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ```

## 3. 验证与测试方案
1. 运行开发服务器，登录进入简历编辑页面。
2. 展开多个配置折叠块，然后双击右侧的“专业技能”内容：
   * 验证：左侧配置栏除“基本信息”和“专业技能”外，其他模块均折叠。
   * 验证：左侧“专业技能”模块平滑滚动至滚动容器顶部。
   * 验证：双击处文字没有被蓝色背景高亮选中。
3. 双击右侧的“工作经历”内容：
   * 验证：“专业技能”模块收起，“工作经历”模块展开并平滑滚动到顶部。
