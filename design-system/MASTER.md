# 设计系统 Master 主文件

> **逻辑：** 在构建特定页面时，首先检查 `design-system/pages/[page-name].md`。
> 如果该文件存在，其规则将**覆盖（override）**此 Master 主文件。
> 如果不存在，请严格遵守以下规则。

---

**项目：** AI Resume Designer
**生成时间：** 2026-06-12 10:23:18
**类别：** AI/Chatbot Platform

---

## 全局规则

### 色板 / 色彩搭配

| 角色 | Hex 颜色值 | CSS 变量 |
|------|-----|--------------|
| Primary | `#7C3AED` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#6366F1` | `--color-secondary` |
| Accent/CTA | `#EC4899` | `--color-accent` |
| Background | `#FAF5FF` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Muted | `#F7F3FD` | `--color-muted` |
| Border | `#EFE7FC` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#7C3AED` | `--color-ring` |

**配色备注：** AI 紫+一代粉

### 字体排版

- **标题字体：** Roboto
- **正文字体：** Roboto
- **氛围：** material design 3, md3, android, google, tonal, friendly, rounded, accessible, adaptive
- **Google 字体：** [Roboto + Roboto](https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400)

**CSS 导入：**
```css
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');
```

### 间距变量

| Token 标记 | 变量值 | 使用场景 |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | 紧凑间隙 |
| `--space-sm` | `8px` / `0.5rem` | 图标间隙、行内间距 |
| `--space-md` | `16px` / `1rem` | 标准内边距 |
| `--space-lg` | `24px` / `1.5rem` | 区块内边距 |
| `--space-xl` | `32px` / `2rem` | 较大间隙 |
| `--space-2xl` | `48px` / `3rem` | 区块外边距 |
| `--space-3xl` | `64px` / `4rem` | Hero 区域内边距 |

### 阴影深度

| 阴影级别 | 阴影值 | 使用场景 |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 微弱浮起感 |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | 卡片、按钮 |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | 模态框、下拉菜单 |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero 区域图片、特色卡片 |

---

## 组件规范

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #EC4899;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #7C3AED;
  border: 2px solid #7C3AED;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FAF5FF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #7C3AED;
  outline: none;
  box-shadow: 0 0 0 3px #7C3AED20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## 风格指南

**设计风格：** AI-Native UI

**关键词：** Chatbot, conversational, voice, assistant, agentic, ambient, minimal chrome, streaming text, AI interactions

**最适合：** 人工智能产品、聊天机器人、语音助手、副驾驶、人工智能工具、对话界面

**关键特效：** 打字指示器（3 点脉冲）、流文本动画、脉冲动画、上下文卡、平滑显示

### 页面模式

**模式名称：** AI Personalization Landing

- **转化策略：** 个性化转化率超过 20%。需要分析集成。新用户的后备。
- **CTA 布局：** Context-aware placement based on user segment
- **板块顺序：** 1. Dynamic hero (personalized), 2. Relevant features, 3. Tailored testimonials, 4. Smart CTA

---

## 反模式（请勿使用）

- ❌ 重镀铬
- ❌ 反应迟钝

### 其他禁用模式

- ❌ **禁用表情符号作为图标** — 请使用 SVG 图标 (Heroicons, Lucide, Simple Icons)
- ❌ **缺失 cursor:pointer** — 所有可点击元素必须具有 cursor:pointer
- ❌ **悬停引起布局抖动** — 避免使用会导致布局位移的缩放变形 (scale transforms)
- ❌ **文本对比度低** — 至少保持 4.5:1 的最小对比度
- ❌ **状态瞬间改变** — 必须使用平滑过渡 transitions (150-300ms)
- ❌ **焦点状态不可见** — 焦点状态必须可见，以满足无障碍性需求

---

## 交付前核对清单

在交付任何 UI 代码之前，请仔细核对以下内容：

- [ ] 禁用表情符号作为图标 (使用 SVG 替代)
- [ ] 所有图标来自同一种图标库 (Heroicons/Lucide)
- [ ] 所有可点击元素上都具有 `cursor-pointer`
- [ ] 悬停状态应带有平滑过渡 (150-300ms)
- [ ] 亮色模式：文本对比度最小为 4.5:1
- [ ] 键盘导航的焦点状态可见
- [ ] 尊重 `prefers-reduced-motion` (减弱动画偏好)
- [ ] 响应式布局：支持 375px, 768px, 1024px, 1440px
- [ ] 无任何内容被固定导航栏遮挡
- [ ] 移动端无水平滚动条
