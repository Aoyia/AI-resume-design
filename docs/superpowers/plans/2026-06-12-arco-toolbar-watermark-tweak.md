# Arco UI 改造与通栏底色条纤细化实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将排版样式浮层控件重构为 Arco Design 风格（`Select` & `Switch`），并微调通栏底色条（`watermark-bar`）使其更纤细紧凑。

**架构：** 在 `Toolbar.tsx` 中导入 `@arco-design/web-react` 的 `Select` 和 `Switch` 组件进行 UI 组件化替换；在 `ClassicTemplate.tsx` 中缩窄 `watermark-bar` 的 `padding` 内边距并降低默认高度兜底值。

**技术栈：** React, Next.js, TailwindCSS, Arco Design (@arco-design/web-react)

---

## 文件结构

- 修改：[ClassicTemplate.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/templates/ClassicTemplate.tsx) (降低 watermark-bar 高度和 padding 厚度)
- 修改：[Toolbar.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/editor/Toolbar.tsx) (替换 select 和 button 控件为 Arco 组件)

---

## 详细任务步骤

### 任务 1：微调 ClassicTemplate 的通栏底色条样式

**文件：**
- 修改：[ClassicTemplate.tsx:39-41](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/templates/ClassicTemplate.tsx#L39-L41)
- 修改：[ClassicTemplate.tsx:81-91](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/templates/ClassicTemplate.tsx#L81-L91)

- [ ] **步骤 1：修改默认高度兜底与 padding**

  编辑 `src/components/templates/ClassicTemplate.tsx`：
  将 `height` 的计算公式修改为：
  ```typescript
    const height = theme.dividerHeight ?? (
      style === 'left-bar' ? 4 : 
      style === 'watermark-bar' ? 3 : 1.5
    );
  ```
  
  并将 `style === 'watermark-bar'` 的返回样式修改为：
  ```typescript
    } else if (style === 'watermark-bar') {
      return {
        ...baseStyle,
        position: 'relative',
        width: '100%',
        background: `${color}0A`,
        borderLeft: `${height}px solid ${color}`,
        padding: '3.5px 8px',
        borderRadius: '0px',
        marginBottom: '8px',
      };
    }
  ```

- [ ] **步骤 2：运行构建进行类型验证**

  运行：`npx tsc --noEmit`
  预期：PASS，没有 TypeScript 编译错误。

- [ ] **步骤 3：Commit 变更**

  ```bash
  git add src/components/templates/ClassicTemplate.tsx
  git commit -m "style: make watermark-bar divider slimmer by reducing padding and default height"
  ```

---

### 任务 2：将 Toolbar 的排版控件重构为 Arco 组件

**文件：**
- 修改：[Toolbar.tsx](file:///Users/neoyuan/Desktop/aoyi/AI-resume-design/src/components/editor/Toolbar.tsx)

- [ ] **步骤 1：引入 Arco 组件**

  在 `src/components/editor/Toolbar.tsx` 文件头部引入 `Select` 与 `Switch` 组件：
  ```typescript
  import { Select, Switch } from '@arco-design/web-react';
  ```

- [ ] **步骤 2：重构排版样式浮层内的表单控件**

  编辑 `src/components/editor/Toolbar.tsx` 中 `className="flex flex-col gap-3 py-2 px-1 text-slate-700"` 容器内部的设置面板段落：
  
  ```tsx
                  {/* 字体与字号 */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">字体</label>
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
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">基准字号</label>
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
                    </div>
                  </div>

                  {/* 标题装饰风格 */}
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题装饰风格</label>
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
                  </div>
                  
                  {/* 线条粗细与背景开关 (并排展示) */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                        {isVerticalStyle ? '竖线宽度' : '横线粗细'}
                      </label>
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
                    </div>
                  
                    {style === 'left-bar' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-[var(--text-secondary)]">标题底色</label>
                        <div className="flex items-center h-8">
                          <Switch
                            checked={resume.theme.enableTitleBg}
                            onChange={(val) => updateTheme({ enableTitleBg: val })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 模块间距 & 行高倍数 */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">模块间距</label>
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
                    </div>
                  
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)]">文本行高</label>
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
                    </div>
                  </div>
  ```

- [ ] **步骤 3：验证类型与项目构建**

  运行：`npx tsc --noEmit && npm run build`
  预期：PASS，所有组件和属性类型正确，项目编译打包通过。

- [ ] **步骤 4：Commit 变更**

  ```bash
  git add src/components/editor/Toolbar.tsx
  git commit -m "feat: replace custom select/switch components in typography settings with Arco Design equivalents"
  ```
