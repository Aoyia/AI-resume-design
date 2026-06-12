'use client';

import { ResumeData } from '@/types/resume';
import ClassicTemplate, { getFlatElements, FONT_FALLBACKS } from '@/components/templates/ClassicTemplate';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import './print.css';

const A4_W = 794;
const A4_H = 1123;
const A4_PADDING_Y = 48;
const A4_CONTENT_H = A4_H - A4_PADDING_Y * 2;
const A4_SAFE_CONTENT_H = A4_CONTENT_H - 8; // 8px 安全缓冲区，防止临界渲染超高

function PrintContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [pages, setPages] = useState<number[][]>([]);
  const [isReady, setIsReady] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);

  // 1. 客户端获取临时数据
  useEffect(() => {
    if (id) {
      fetch(`/api/pdf/data?id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            if (data.resume) {
              setResume(data.resume);
              if (data.pages) {
                setPages(data.pages);
                setIsReady(true);
              }
            } else {
              // 兼容老数据结构
              setResume(data);
            }
          }
        })
        .catch((err) => {
          console.error('[Fetch print data error]', err);
        });
    }
  }, [id]);

  // 2. 动态测量高度并分页 (仅作为未传 pages 时的兜底降级方案)
  useEffect(() => {
    if (!resume) return;
    if (pages.length > 0 && isReady) return;

    // 确保字体加载完毕后再进行测量，极度关键！
    const doMeasure = () => {
      if (!measureRef.current) return;

      const children = Array.from(measureRef.current.children);
      const heights = children.map((child) => {
        const marginTop = parseFloat((child as HTMLElement).style.marginTop || '0');
        return child.getBoundingClientRect().height + marginTop;
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

      setPages(computedPages);
      setIsReady(true);
    };

    // 等待 fonts ready 并加上轻微延时以保证 React DOM 树完全渲染稳定
    let measureCalled = false;
    const safeMeasure = () => {
      if (measureCalled) return;
      measureCalled = true;
      doMeasure();
    };

    if (typeof document !== 'undefined' && document.fonts) {
      Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 500))
      ]).then(() => {
        setTimeout(safeMeasure, 50);
      });
    } else {
      setTimeout(safeMeasure, 100);
    }
  }, [resume, pages, isReady]);


  if (!resume) {
    return <div style={{ padding: 40, background: 'white' }}>正在加载简历数据...</div>;
  }

  const flatElements = getFlatElements(resume);
  const displayPages = pages.length > 0 ? pages : [Array.from({ length: flatElements.length }, (_, i) => i)];
  const fontFamilyValue = FONT_FALLBACKS[resume.theme.fontFamily] || resume.theme.fontFamily;

  return (
    <div className="print-wrapper" data-ready={isReady ? 'true' : 'false'}>
      {/* 隐藏的测量沙盒 - 必须与 PreviewPanel 中以及真实 print-page-container 的尺寸和 padding 完全一致 */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none break-all tracking-wide text-gray-800"
        style={{
          width: A4_W,
          padding: '48px 52px',
          left: -9999,
          top: -9999,
          fontFamily: fontFamilyValue,
          fontSize: `${resume.theme.fontSize}px`,
          lineHeight: resume.theme.lineHeight,
          boxSizing: 'border-box',
        }}
      >
        {flatElements}
      </div>

      {/* 真实分页打印 - 使用 px 强制控制尺寸 */}
      {displayPages.map((indices, pageIdx) => (
        <div key={pageIdx} className="print-page-container">
          <ClassicTemplate data={resume} elementIndices={indices} />
        </div>
      ))}
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, background: 'white' }}>正在初始化打印组件...</div>}>
      <PrintContent />
    </Suspense>
  );
}
