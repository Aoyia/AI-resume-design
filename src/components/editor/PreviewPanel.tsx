'use client';

import { useResumeStore } from '@/store/useResumeStore';
import ClassicTemplate, { getFlatElements } from '@/components/templates/ClassicTemplate';
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

/** A4尺寸常量（px，96dpi） */
const A4_W = 794;
const A4_H = 1123;
const A4_PADDING_Y = 48; // 上下 padding 各 48px
const A4_CONTENT_H = A4_H - A4_PADDING_Y * 2; // 1027px 有效高度

export default function PreviewPanel() {
  const { resume } = useResumeStore();
  const [scale, setScale] = useState(0.75);
  const [pages, setPages] = useState<number[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const flatElements = getFlatElements(resume);

  const adjustScale = (delta: number) => {
    setScale((s) => Math.min(1.2, Math.max(0.4, +(s + delta).toFixed(2))));
  };

  // 动态测量高度并分页
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!measureRef.current) return;

      const children = Array.from(measureRef.current.children);
      const heights = children.map((child) => {
        const style = window.getComputedStyle(child);
        const marginTop = parseFloat(style.marginTop || '0');
        const marginBottom = parseFloat(style.marginBottom || '0');
        return child.getBoundingClientRect().height + marginTop + marginBottom;
      });

      let currentPage: number[] = [];
      let currentHeight = 0;
      const computedPages: number[][] = [];

      for (let i = 0; i < children.length; i++) {
        const h = heights[i];
        // 如果加上当前节点超过了 A4 可用高度，且当前页已经有内容，则推入下一页
        if (currentHeight + h > A4_CONTENT_H && currentPage.length > 0) {
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

      setPages(computedPages);
    }, 60); // 延迟 60ms，等待 DOM 完全更新完毕后执行精确高度测量

    return () => clearTimeout(timer);
  }, [resume]);

  const displayPages = pages.length > 0 ? pages : [Array.from({ length: flatElements.length }, (_, i) => i)];

  const gap = 24;
  const pagesCount = displayPages.length;
  const rawHeight = A4_H * pagesCount + gap * (pagesCount - 1);
  const scaledHeight = rawHeight * scale;

  return (
    <div className="relative h-full flex flex-col bg-[var(--surface)]">
      {/* 缩放工具栏 */}
      <div className="flex items-center justify-center gap-0.5 py-1 border-b border-[var(--border)] bg-white shrink-0 z-10">
        <button onClick={() => adjustScale(-0.05)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer rounded transition-colors focus:outline-none"><ZoomOut size={13} /></button>
        <span className="text-xs text-[var(--text-muted)] w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => adjustScale(0.05)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-0 cursor-pointer rounded transition-colors focus:outline-none"><ZoomIn size={13} /></button>
      </div>

      {/* 隐藏的测量沙盒容器 */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{
          width: A4_W,
          padding: `48px 52px`,
          left: -9999,
          top: -9999,
          fontFamily: resume.theme.fontFamily,
          fontSize: `${resume.theme.fontSize}px`,
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
                <ClassicTemplate data={resume} elementIndices={indices} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
