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
 * 使用数学最佳五次贝塞尔曲线进行物理平滑滚动
 * 
 * @param target 目标 DOM 节点
 * @param duration 动画持续时长 (毫秒)
 * @param position 视口对焦位置：'start' 顶部对齐（预留呼吸空白），'center' 居中对齐
 */
export function smoothScrollTo(target: HTMLElement, duration = 400, position: 'start' | 'center' = 'start') {
  const container = getScrollParent(target);
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  let targetScrollTop = 0;
  if (container === document.documentElement) {
    const targetTopFromDoc = window.scrollY + targetRect.top;
    if (position === 'center') {
      targetScrollTop = targetTopFromDoc - (window.innerHeight - targetRect.height) / 2;
    } else {
      targetScrollTop = targetTopFromDoc - 16; // 顶部预留 16px 呼吸空白
    }
  } else {
    const relativeTop = targetRect.top - containerRect.top;
    const targetTopFromContainer = container.scrollTop + relativeTop;
    if (position === 'center') {
      targetScrollTop = targetTopFromContainer - (container.clientHeight - targetRect.height) / 2;
    } else {
      targetScrollTop = targetTopFromContainer - 16; // 顶部预留 16px 呼吸空白
    }
  }

  // 边界安全约束限制
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  if (Math.abs(distance) < 2) return; // 距离极其微小则无需开启动画

  const startTime = performance.now();

  function animate(currentTime: number) {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // 五次贝塞尔曲线 (Quintic Ease-In-Out)
    // 数学公式：t < 0.5 ? 16t^5 : 1 - (-2t + 2)^5 / 2
    // 该曲线不仅起步与刹车段速度平滑过度为零，其二阶导数也为零，能呈现出极具物理缓释感的高档惯性质感。
    const ease = progress < 0.5
      ? 16 * Math.pow(progress, 5)
      : 1 - Math.pow(-2 * progress + 2, 5) / 2;

    container.scrollTop = startScrollTop + distance * ease;

    if (timeElapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      container.scrollTop = targetScrollTop; // 最终帧位置物理校准
    }
  }

  requestAnimationFrame(animate);
}
