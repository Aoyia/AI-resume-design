/**
 * 数学与物理学最优化物理滚动引擎 - 自定义五次贝塞尔缓动平滑定位
 */

/**
 * 递归寻找最近的溢出滚动父容器
 */
function getScrollParent(node: HTMLElement | null): HTMLElement {
  if (node == null) {
    return document.documentElement;
  }
  if (node.scrollHeight > node.clientHeight) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
  }
  return getScrollParent(node.parentElement);
}

/**
 * 使用数学最佳五次贝塞尔曲线进行物理平滑滚动 (支持动态雷达位置追踪，防折叠高度抖变漂移)
 * 
 * @param target 目标 DOM 节点
 * @param duration 动画持续时长 (毫秒)
 * @param position 视口对焦位置：'start' 顶部对齐（预留呼吸空白），'center' 居中对齐
 */
export function smoothScrollTo(target: HTMLElement, duration = 400, position: 'start' | 'center' = 'start') {
  const container = getScrollParent(target);
  if (!container) return;

  const startTime = performance.now();
  const startScrollTop = container.scrollTop;

  // 雷达对准函数：在每一帧实时获取当前 DOM 真实形变下的绝对目标 scrollTop
  function getAbsoluteTargetScrollTop(): number {
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    let targetTop = 0;
    if (container === document.documentElement) {
      const targetTopFromDoc = window.scrollY + targetRect.top;
      if (position === 'center') {
        targetTop = targetTopFromDoc - (window.innerHeight - targetRect.height) / 2;
      } else {
        targetTop = targetTopFromDoc - 16; // 顶部预留 16px 呼吸空白
      }
    } else {
      const relativeTop = targetRect.top - containerRect.top;
      const targetTopFromContainer = container.scrollTop + relativeTop;
      if (position === 'center') {
        targetTop = targetTopFromContainer - (container.clientHeight - targetRect.height) / 2;
      } else {
        targetTop = targetTopFromContainer - 16; // 顶部预留 16px 呼吸空白
      }
    }

    // 边界安全约束限制
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    return Math.max(0, Math.min(targetTop, maxScrollTop));
  }

  function animate(currentTime: number) {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // 瞬时雷达更新：获取当前帧由于左侧其他手风琴折叠坍塌导致的最新精准物理位置
    const currentTargetScrollTop = getAbsoluteTargetScrollTop();

    // 五次贝塞尔曲线 (Quintic Ease-In-Out)
    const ease = progress < 0.5
      ? 16 * Math.pow(progress, 5)
      : 1 - Math.pow(-2 * progress + 2, 5) / 2;

    // 自适应导弹轨线计算：当前帧 scrollTop = 起始点 + (瞬时最新终点 - 起始点) * 进度百分比
    container.scrollTop = startScrollTop + (currentTargetScrollTop - startScrollTop) * ease;

    if (timeElapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      // 最后一帧，当折叠 transition 完全静止时，进行终极物理校准锁死，杜绝 1px 漂移
      container.scrollTop = getAbsoluteTargetScrollTop();
    }
  }

  requestAnimationFrame(animate);
}
