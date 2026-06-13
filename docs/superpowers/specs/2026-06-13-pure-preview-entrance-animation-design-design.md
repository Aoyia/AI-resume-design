# 纯净模式入场丝滑物理动效 — 设计规格说明书

本规格说明书定义了在简历系统“初次加载 / 展示纯净预览界面”时，采用的渐进式深度视差物理动效的设计规格与技术实现。

---

## 1. 目标与成功指标
- **视觉体验**：首屏加载时，背景、简历本体、引导提示层有明显的“深度视差”与非对称时序（Stagger），动作顺畅平滑。
- **物理运动特性**：采用物理阻尼减速（临界阻尼 \(\zeta = 1\)）和微小弹性收纳的贝塞尔曲线，杜绝生硬和过长无意义的摇晃。
- **降级兼容与性能**：必须全部通过 GPU 硬件加速的属性（`transform`, `opacity`, `filter`）实现；在 Puppeteer 无头浏览器或 SSR 模式下无缝退化为完全可见，避免影响 PDF 分页导出精度。
- **扩展性**：动效模块必须高度抽象，便于在登录 Gate、设置等其他功能区进行复用。

---

## 2. 动效核心组件规格 `AnimateEntrance`

我们将代码抽离为一个通用的物理动效包裹组件，路径为 `src/components/shared/AnimateEntrance.tsx`。

### 2.1 API 定义 (Interface Props)
```typescript
export interface AnimateEntranceProps {
  /** 动效包裹的子元素 */
  children: React.ReactNode;
  /** 动效物理模型类型 */
  type?: 'fade-slide' | 'fade-scale' | 'bg-blur';
  /** 滑动方向，仅适用于 fade-slide */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** 滑动位移的物理像素数，默认为 35px */
  distance?: number;
  /** 延迟执行动画的时间 (ms) */
  delay?: number;
  /** 动画持续的时间 (ms) */
  duration?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;
}
```

### 2.2 物理运动数学曲线 (Cubic-Bezier Curves)
- **临界阻尼曲线 (Critical Damping Approach)**：`cubic-bezier(0.16, 1, 0.3, 1)` (即 EaseOutExpo)。用于滑行减速、毛玻璃滤镜柔化，提供优雅、极速响应又克制的收尾。
- **轻微弹性曲线 (Bounce Damping Approach)**：`cubic-bezier(0.34, 1.56, 0.64, 1)` (即 EaseOutBack)。用于最前层卡片的弹跳，使其更具实体拟物感。

---

## 3. 首屏入场时序设计 (Parallax Stagger)

在 `PreviewPanel.tsx` 首次加载且 `authorized` 为 false 时，三大图层以如下顺序滑入：

| 图层名称 | 动效类型 | 曲线类型 | 物理效果参数 | 时序参数 (Delay / Duration) |
| :--- | :--- | :--- | :--- | :--- |
| **背景流光层** | `bg-blur` | 临界阻尼 | `scale: 1.05 -> 1`<br>`opacity: 0 -> 1`<br>`blur(0) -> blur(25px)` | `delay: 0ms`<br>`duration: 900ms` |
| **简历纸张层** | `fade-slide` | 临界阻尼 | `translateY: 35px -> 0px`<br>`opacity: 0 -> 1` | `delay: 120ms`<br>`duration: 750ms` |
| **顶部引导提示** | `fade-scale` | 轻微弹性 | `scale: 0.94 -> 1`<br>`opacity: 0 -> 1` | `delay: 350ms`<br>`duration: 450ms` |

---

## 4. 健壮性与退化处理
为了杜绝 Puppeteer 在生成 PDF 过程中因动画未完成导致导出的内容缺失或截图为空，本组件需自动识别用户代理或执行状态。在以下情况自动跳过动画直接展示最终态：
1. 页面含有 `@media print` 样式渲染或是在打印页面 `/print`。
2. 或者是处于非浏览器挂载状态的 SSR 阶段。

---

## 5. 视觉连续性设计 (Visual Continuity & Preload)
为了消除页面冷启动时“正在验证授权信息...”白屏遮罩带来的硬性闪烁与打断，本系统实施静默预载机制：
1. 在组件挂载的校验期 (`checking === true`)，直接无声渲染未授权的“纯净预览模式”静止框架，拒绝任何文本/白屏遮罩。
2. 校验完成后，若为未授权状态，则无缝在当前页上直接触发视差动效，使加载与动效一气呵成。
3. 若为已授权状态，则侧边栏和工具栏以平滑滑出的侧拉动画展开。
