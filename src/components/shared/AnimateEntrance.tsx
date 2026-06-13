'use client';

import React, { useEffect, useState } from 'react';

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

// 物理动效三次贝塞尔曲线常量
const SPRING_CRITICAL = 'cubic-bezier(0.21, 1.02, 0.43, 1.01)'; // 优雅阻尼 (无回弹)
const SPRING_BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // 轻微弹性

export default function AnimateEntrance({
  children,
  type = 'fade-slide',
  direction = 'up',
  distance = 60,
  delay = 0,
  duration = 600,
  className = '',
  style = {},
}: AnimateEntranceProps) {
  const [isAnimate, setIsAnimate] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);

  useEffect(() => {
    // 1. SSR 退化防抖：确保仅在客户端渲染时激活
    // 2. 检测当前是否处于 print 打印模式或 Puppeteer 环境，跳过动画直接展示
    const isPrintMedia = window.matchMedia('print').matches;
    const isPuppeteer = typeof navigator !== 'undefined' && navigator.userAgent.includes('HeadlessChrome');
    
    if (isPrintMedia || isPuppeteer) {
      setShouldSkip(true);
      return;
    }
    
    // 启动延迟器，在特定 delay 之后激活 style 过渡状态
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
