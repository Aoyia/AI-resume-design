# 设计规格：Arco UI 改造与通栏底色条纤细化

本规格说明书记录了关于排版浮层组件 Arco 化改造以及“通栏底色条”样式紧凑纤细化调整的设计方案。

## 1. 目标

1. **界面体验提升**：将排版设置浮层内的原生 `<select>` 下拉与自定义 `<button>` 开关替换为 Arco Design 组件，消除浏览器的原生粗糙感，与应用中已有的 Arco UI 风格完全对齐。
2. **通栏底色条精致化**：将通栏底色条的内边距和默认竖条粗细进行收紧，在保留淡色通栏块底色呼应的基础上，呈现更纤细、紧凑和高品质的视觉效果。

---

## 2. 修改范围与详细设计

### 2.1 排版面板控件 Arco UI 替换

在 [Toolbar.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/editor/Toolbar.tsx) 中引入 Arco Design 依赖，并做如下替换：

*   **引入组件**：
    ```typescript
    import { Select, Switch } from '@arco-design/web-react';
    ```
*   **字体选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.fontFamily}
      onChange={(val) => updateTheme({ fontFamily: val })}
      style={{ width: '100%' }}
    >
      <Select.Option value="Noto Serif SC">思源宋体</Select.Option>
      <Select.Option value="Noto Sans SC">思源黑体</Select.Option>
      <Select.Option value="Inter">Inter</Select.Option>
    </Select>
    ```
*   **基准字号选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.fontSize}
      onChange={(val) => updateTheme({ fontSize: val })}
      style={{ width: '100%' }}
    >
      {[12, 13, 14, 15, 16].map((s) => (
        <Select.Option key={s} value={s}>{s}px</Select.Option>
      ))}
    </Select>
    ```
*   **标题装饰风格选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.dividerStyle || 'left-bar'}
      onChange={(val) => updateTheme({ dividerStyle: val })}
      style={{ width: '100%' }}
    >
      <Select.Option value="left-bar">✨ 高端竖条</Select.Option>
      <Select.Option value="skew-block">💎 斜角底色块</Select.Option>
      <Select.Option value="light-line">🍃 轻盈细线</Select.Option>
      <Select.Option value="watermark-bar">💠 通栏底色条</Select.Option>
      <Select.Option value="solid">经典横线</Select.Option>
      <Select.Option value="none">无装饰极简</Select.Option>
    </Select>
    ```
*   **线条宽度 / 粗细选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.dividerHeight ?? 4}
      onChange={(val) => updateTheme({ dividerHeight: val })}
      style={{ width: '100%' }}
    >
      {[1, 2, 3, 4, 5, 6].map((w) => (
        <Select.Option key={w} value={w}>{w}px</Select.Option>
      ))}
    </Select>
    ```
*   **模块间距选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.sectionGap ?? 16}
      onChange={(val) => updateTheme({ sectionGap: val })}
      style={{ width: '100%' }}
    >
      {[8, 12, 16, 20, 24, 28].map((g) => (
        <Select.Option key={g} value={g}>{g}px</Select.Option>
      ))}
    </Select>
    ```
*   **文本行高选择器**：
    ```tsx
    <Select
      size="small"
      value={resume.theme.lineHeight ?? 1.6}
      onChange={(val) => updateTheme({ lineHeight: val })}
      style={{ width: '100%' }}
    >
      {[1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0].map((lh) => (
        <Select.Option key={lh} value={lh}>{lh.toFixed(1)}倍</Select.Option>
      ))}
    </Select>
    ```
*   **标题底色开关**：
    ```tsx
    <Switch
      checked={resume.theme.enableTitleBg}
      onChange={(val) => updateTheme({ enableTitleBg: val })}
    />
    ```

---

### 2.2 通栏底色条（`watermark-bar`）纤细紧凑调整

在 [ClassicTemplate.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/templates/ClassicTemplate.tsx) 中做以下调整：

*   **压缩 padding 内边距**：
    将 `watermark-bar` 的容器 padding 修改为 `3.5px 8px`，整体收窄垂直方向高度。
*   **调整默认左侧竖线厚度**：
    当 `dividerHeight` 未显式设置时，如果是 `watermark-bar`，默认宽度定为更为精致纤细的 `3px`（而非原先粗重的 `4px`）。
    ```typescript
    const height = theme.dividerHeight ?? (
      style === 'left-bar' ? 4 : 
      style === 'watermark-bar' ? 3 : 1.5
    );
    ```

---

## 3. 验证方案

### 3.1 自动化编译与类型测试
在本地仓库运行以下命令，确保组件的类型引用正确，没有 TypeScript 报错，且能够成功打出 Next.js 生产包：
```bash
npx tsc --noEmit && npm run build
```

### 3.2 手动功能核对
1. 启动本地开发服务，并在浏览器中打开 `http://localhost:3001`。
2. 展开“排版样式设置”浮层，点击下拉框，确认其呈现了 Arco UI 样式的下拉菜单与动画。
3. 确认标题底色开关工作正常。
4. 切换到“通栏底色条”，确认底条的厚度和左侧竖线条默认变窄，且呈无圆角直角效果。
