'use client';

import { useResumeStore } from '@/store/useResumeStore';
import ClassicTemplate, { getFlatElements, FONT_FALLBACKS } from '@/components/templates/ClassicTemplate';
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

/** A4尺寸常量（px，96dpi） */
const A4_W = 794;
const A4_H = 1123;
const A4_PADDING_Y = 48; // 上下 padding 各 48px
const A4_CONTENT_H = A4_H - A4_PADDING_Y * 2; // 1027px 有效高度

export default function PreviewPanel() {
  const { resume, pages, setPages } = useResumeStore();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // 用一个局部状态缓存防抖后的 resume 用于计算分页
  const [debouncedResume, setDebouncedResume] = useState(resume);

  // 防抖处理：100ms 内无输入才更新 debouncedResume，防止打字时卡顿且保持高敏捷响应
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedResume(resume);
    }, 100);

    return () => clearTimeout(handler);
  }, [resume]);

  const adjustScale = (delta: number) => {
    setScale((s) => Math.min(1.2, Math.max(0.4, +(s + delta).toFixed(2))));
  };

  // 辅助函数：深度比较分页数组
  const isSamePages = (a: number[][], b: number[][]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  };

  const heightCacheRef = useRef<Map<string, number>>(new Map());
  const A4_SAFE_CONTENT_H = A4_CONTENT_H - 8; // 8px 安全缓冲区，防止边界条件下的溢出

  // 根据 debouncedResume 动态测量高度并分页
  useEffect(() => {
    if (!measureRef.current) return;
    const tStart = performance.now();

    // 强制执行测量以确保 DOM 状态最新
    const children = Array.from(measureRef.current.children);
    const heights = children.map((child) => {
      const cacheKey = child.getAttribute('data-cache-key');
      const marginTop = parseFloat((child as HTMLElement).style.marginTop || '0');

      if (cacheKey && heightCacheRef.current.has(cacheKey)) {
        return heightCacheRef.current.get(cacheKey)!;
      }

      // getBoundingClientRect 包含 border + padding，但子元素无 border/padding，主要是内容高度
      const h = child.getBoundingClientRect().height + marginTop;
      if (cacheKey) {
        heightCacheRef.current.set(cacheKey, h);
      }
      return h;
    });

    let currentPage: number[] = [];
    let currentHeight = 0;
    const computedPages: number[][] = [];

    for (let i = 0; i < children.length; i++) {
      const h = heights[i];
      const child = children[i];
      const type = child.getAttribute('data-type');
      const group = child.getAttribute('data-group');

      // 预判是否超出可用高度
      let shouldBreak = (currentHeight + h > A4_SAFE_CONTENT_H);

      // 如果没有超出，但需要进行 Orphan 保护
      if (!shouldBreak && currentPage.length > 0) {
        // 保护 1：模块大标题
        if (type === 'section-title') {
          const nextH = heights[i + 1] || 0;
          if (currentHeight + h + nextH > A4_SAFE_CONTENT_H) {
            shouldBreak = true;
          }
        }
        // 保护 2：经历项头部
        else if (type === 'item-header' && group) {
          const nextChild = children[i + 1];
          const nextGroup = nextChild?.getAttribute('data-group');
          const nextType = nextChild?.getAttribute('data-type');
          if (nextChild && nextGroup === group && nextType === 'item-desc') {
            const nextH = heights[i + 1] || 0;
            if (currentHeight + h + nextH > A4_SAFE_CONTENT_H) {
              shouldBreak = true;
            }
          }
        }
      }

      if (shouldBreak && currentPage.length > 0) {
        computedPages.push(currentPage);
        currentPage = [i];
        currentHeight = h;
      } else {
        currentPage.push(i);
        currentHeight += h;
      }
    }
    if (currentPage.length > 0) {
      computedPages.push(currentPage);
    }

    if (!isSamePages(pages, computedPages)) {
      setPages(computedPages);
    }

    if (typeof window !== 'undefined') {
      (window as any).__last_measure_duration = performance.now() - tStart;
    }
  }, [debouncedResume, pages, setPages]);

  const flatElements = getFlatElements(debouncedResume);
  const displayPages = pages.length > 0 ? pages : [Array.from({ length: flatElements.length }, (_, i) => i)];

  const gap = 24;
  const pagesCount = displayPages.length;
  const rawHeight = A4_H * pagesCount + gap * (pagesCount - 1);
  const scaledHeight = rawHeight * scale;

  const fontFamilyValue = FONT_FALLBACKS[debouncedResume.theme.fontFamily] || debouncedResume.theme.fontFamily;

  return (
    <div className="relative h-full flex flex-col bg-[var(--surface)]">
      {/* 缩放工具栏 */}
      <div className="flex items-center justify-center gap-0.5 py-1 border-b border-[var(--border)] bg-white shrink-0 z-10">
        <button onClick={() => adjustScale(-0.05)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer rounded transition-colors focus:outline-none"><ZoomOut size={13} /></button>
        <span className="text-xs text-[var(--text-muted)] w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => adjustScale(0.05)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer rounded transition-colors focus:outline-none"><ZoomIn size={13} /></button>
      </div>

      {/* 隐藏的测量沙盒容器 - 使用与真实 A4 页面完全一致的宽度和 padding，并加上 boxSizing: border-box */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none break-all tracking-wide text-gray-800"
        style={{
          width: A4_W,
          padding: `48px 52px`,
          left: -9999,
          top: -9999,
          fontFamily: fontFamilyValue,
          fontSize: `${debouncedResume.theme.fontSize}px`,
          lineHeight: debouncedResume.theme.lineHeight,
          boxSizing: 'border-box',
        }}
      >
        {flatElements}
      </div>

      {/* 真实渲染预览滚动区 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto p-6 flex flex-col items-center">
        {/* 缩放物理包裹层 */}
        <div
          style={{
            width: A4_W * scale,
            height: scaledHeight,
            position: 'relative',
            flexShrink: 0,
            transition: 'width 0.2s ease-out, height 0.2s ease-out',
          }}
        >
          {/* 缩放容器 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              display: 'flex',
              flexDirection: 'column',
              gap: `${gap}px`,
              width: A4_W,
              height: rawHeight,
            }}
          >
            {displayPages.map((indices, pageIdx) => (
              <div
                key={pageIdx}
                className="paper-shadow bg-white shrink-0 relative overflow-hidden"
                style={{
                  width: A4_W,
                  height: A4_H,
                  padding: '48px 52px',
                  boxSizing: 'border-box',
                }}
              >
                {/* 装饰用页码 */}
                <div className="absolute right-6 bottom-4 text-[10px] text-[var(--text-muted)] select-none">
                  第 {pageIdx + 1} 页 / 共 {pagesCount} 页
                </div>
                <ClassicTemplate data={debouncedResume} elementIndices={indices} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
