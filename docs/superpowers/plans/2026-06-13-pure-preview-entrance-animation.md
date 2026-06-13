# 纯净模式入场丝滑物理动效 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现纯净预览模式的渐进式深度视差物理入场动效，抽离为独立包裹组件，并保证不影响 PDF 生成精度。

**架构：** 创建 `AnimateEntrance` 包裹型动效组件，内部运用临界阻尼 cubic-bezier 物理曲线。在 `PreviewPanel.tsx` 首次载入且 `authorized` 为 false 时，分阶段对背景、简历卡片及引导文字进行非对称 stagger 入场控制。为了完全抽离且易于扩展，动画样式将通过组件内联 style 输出。

**技术栈：** React / TypeScript / CSS Transitions

---

## 文件结构

| 文件路径 | 职责 | 变更类型 |
| :--- | :--- | :--- |
| `src/components/shared/AnimateEntrance.tsx` | 通用物理动效包裹组件，管理过渡状态与内联动画 Style 映射 | **[NEW]** |
| `src/components/editor/PreviewPanel.tsx` | 引入并挂载动效组件，配置图层时序 | 修改 |

---

## 任务 1：创建通用物理动效包裹组件

**文件：**
- 新建：`src/components/shared/AnimateEntrance.tsx`

- [ ] **步骤 1：创建 `src/components/shared/AnimateEntrance.tsx` 并编写实现代码**

编写以下代码，管理组件在客户端 Mount 时挂载动效，并在服务端渲染 (SSR) 或 `@media print` 阶段直接输出无动效的最终就绪态，以确保 PDF 生成绝对正确。

```tsx
'use client';

import React, { useEffect, useState } from 'react';

export interface AnimateEntranceProps {
  children: React.ReactNode;
  type?: 'fade-slide' | 'fade-scale' | 'bg-blur';
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number; // 位移像素大小 (px)
  delay?: number; // 延迟时间 (ms)
  duration?: number; // 持续时间 (ms)
  className?: string;
  style?: React.CSSProperties;
}

// 物理动效三次贝塞尔曲线常量
const SPRING_CRITICAL = 'cubic-bezier(0.16, 1, 0.3, 1)'; // 临界阻尼 (无回弹)
const SPRING_BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // 轻微弹性

export default function AnimateEntrance({
  children,
  type = 'fade-slide',
  direction = 'up',
  distance = 35,
  delay = 0,
  duration = 600,
  className = '',
  style = {},
}: AnimateEntranceProps) {
  const [isAnimate, setIsAnimate] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(true);

  useEffect(() => {
    // 1. SSR 退化防抖：确保仅在客户端渲染时激活
    // 2. 检测当前是否处于 print 打印模式或 Puppeteer 环境，跳过动画直接展示
    const isPrintMedia = window.matchMedia('print').matches;
    const isPuppeteer = navigator.userAgent.includes('HeadlessChrome');
    
    if (isPrintMedia || isPuppeteer) {
      setShouldSkip(true);
      return;
    }

    setShouldSkip(false);
    
    // 启动延迟器，在特定 delay 之后激活 class / styles 状态
    const timer = setTimeout(() => {
      setIsAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // 若跳过动画，则直接呈现静止状态
  if (shouldSkip) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // 计算动画的初始形态样式与最终过渡形态样式
  const getStyles = (): React.CSSProperties => {
    const baseTransition = (properties: string, curve: string) => ({
      transitionProperty: properties,
      transitionDuration: `${duration}ms`,
      transitionTimingFunction: curve,
      willChange: properties,
    });

    switch (type) {
      case 'fade-slide': {
        const getTranslate = () => {
          if (!isAnimate) {
            switch (direction) {
              case 'up': return `translateY(${distance}px)`;
              case 'down': return `translateY(${-distance}px)`;
              case 'left': return `translateX(${distance}px)`;
              case 'right': return `translateX(${-distance}px)`;
              default: return 'none';
            }
          }
          return 'translate(0, 0)';
        };

        return {
          ...style,
          ...baseTransition('transform, opacity', SPRING_CRITICAL),
          opacity: isAnimate ? 1 : 0,
          transform: getTranslate(),
        };
      }
      
      case 'fade-scale': {
        return {
          ...style,
          ...baseTransition('transform, opacity', SPRING_BOUNCE),
          opacity: isAnimate ? 1 : 0,
          transform: isAnimate ? 'scale(1)' : 'scale(0.94)',
        };
      }

      case 'bg-blur': {
        return {
          ...style,
          ...baseTransition('transform, opacity, backdrop-filter, filter', SPRING_CRITICAL),
          opacity: isAnimate ? 1 : 0.4,
          transform: isAnimate ? 'scale(1)' : 'scale(1.05)',
          backdropFilter: isAnimate ? 'blur(20px)' : 'blur(0px)',
          WebkitBackdropFilter: isAnimate ? 'blur(20px)' : 'blur(0px)',
        };
      }

      default:
        return style;
    }
  };

  return (
    <div className={className} style={getStyles()}>
      {children}
    </div>
  );
}
```

- [ ] **步骤 2：Commit 变更**

```bash
git add src/components/shared/AnimateEntrance.tsx
git commit -m "feat: 抽离通用物理入场动效组件 AnimateEntrance，内置临界阻尼曲线"
```

---

## 任务 2：更新 PreviewPanel 引入入场动效

**文件：**
- 修改：`src/components/editor/PreviewPanel.tsx`

- [ ] **步骤 1：在 PreviewPanel 中引入 `AnimateEntrance` 组件**

```tsx
import AnimateEntrance from '@/components/shared/AnimateEntrance';
```

- [ ] **步骤 2：包裹根预览滚动区，配置 `bg-blur` 动效**

对 `containerRef` 所在的预览容器进行动效包裹：

```diff
-      {/* 真实渲染预览滚动区 */}
-      <div 
-        ref={containerRef} 
-        onClick={!authorized ? onStartEdit : undefined}
-        className={`flex-1 overflow-y-auto overflow-x-auto p-6 flex flex-col items-center group relative ${!authorized ? 'cursor-pointer select-none' : ''}`}
-      >
```

修改为：

```tsx
      {/* 真实渲染预览滚动区 */}
      <AnimateEntrance
        type="bg-blur"
        delay={0}
        duration={900}
        className={`flex-1 overflow-y-auto overflow-x-auto p-6 flex flex-col items-center group relative ${!authorized ? 'cursor-pointer select-none' : ''}`}
        style={{ width: '100%', height: '100%' }}
      >
        <div 
          ref={containerRef} 
          onClick={!authorized ? onStartEdit : undefined}
          className="w-full h-full flex flex-col items-center"
        >
```

（注意：调整包裹以确保 `containerRef` 滚动节点和点击拦截事件能够精确工作）

- [ ] **步骤 3：包裹简历纸张页卡，配置滑升动效**

在映射 `displayPages` 时，对每一张 A4 卡片容器进行动效包裹：

```diff
             {displayPages.map((indices, pageIdx) => (
+              <AnimateEntrance
+                key={pageIdx}
+                type="fade-slide"
+                direction="up"
+                distance={35}
+                delay={120 + pageIdx * 80} // Stagger 瀑布流时序
+                duration={750}
+              >
                <div
-                key={pageIdx}
                  className="paper-shadow bg-white shrink-0 relative overflow-hidden"
                  style={{
                    width: A4_W,
                    height: A4_H,
                    padding: `${A4_PADDING_Y}px ${A4_PADDING_X}px`,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 装饰用页码 */}
                  <div className="absolute right-6 bottom-4 text-[10px] text-[var(--text-muted)] select-none">
                    第 {pageIdx + 1} 页 / 共 {pagesCount} 页
                  </div>
                  <ClassicTemplate data={debouncedResume} elementIndices={indices} />
                </div>
+              </AnimateEntrance>
             ))}
```

- [ ] **步骤 4：包裹顶部引导提示卡片，配置弹性浮现动效**

```diff
         {!authorized && (
-          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs py-1.5 px-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 flex items-center gap-1.5 backdrop-blur-sm">
-            <Lightbulb size={13} className="text-amber-400" />
-            <span>点击任意区域输入密码开始编辑</span>
-          </div>
+          <AnimateEntrance
+            type="fade-scale"
+            delay={350}
+            duration={450}
+            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
+          >
+            <div className="bg-slate-900/80 text-white text-xs py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
+              <Lightbulb size={13} className="text-amber-400" />
+              <span>点击任意区域输入密码开始编辑</span>
+            </div>
+          </AnimateEntrance>
         )}
```

- [ ] **步骤 5：Commit 变更**

```bash
git add src/components/editor/PreviewPanel.tsx
git commit -m "feat: PreviewPanel 在纯净模式下应用首屏视差入场动效"
```

---

## 任务 3：运行测试与验证

- [ ] **步骤 1：运行静态编译检查**

运行：`npx tsc --noEmit`
预期：PASS，没有任何类型编译错误

- [ ] **步骤 2：启动测试脚本进行全功能物理回归测试**

运行：`node scratch/test-precision.js`
预期：所有 PDF 导出、物理排版精度匹配均成功通过。这证明动画在无头浏览器中确实被完全跳过（降级），没有给排版高度测量造成任何偏差。

- [ ] **步骤 3：提交回归验证的空 Commit**

```bash
git commit --allow-empty -m "verify: 顺利通过 test-precision 分页排版与降级防抖回归测试"
```
