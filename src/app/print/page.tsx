'use client';

import { ResumeData } from '@/types/resume';
import ClassicTemplate, { getFlatElements } from '@/components/templates/ClassicTemplate';
import { useEffect, useRef, useState } from 'react';
import './print.css';

const A4_W = 794;
const A4_H = 1123;
const A4_PADDING_Y = 48;
const A4_CONTENT_H = A4_H - A4_PADDING_Y * 2;

/** 打印专用路由页面，由 Puppeteer 在服务端访问并截图为 PDF */
export default function PrintPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [pages, setPages] = useState<number[][]>([]);
  const [isReady, setIsReady] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);

  // 客户端获取临时数据
  useEffect(() => {
    if (searchParams.id) {
      fetch(`/api/pdf/data?id=${searchParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setResume(data);
          }
        })
        .catch((err) => {
          console.error('[Fetch print data error]', err);
        });
    }
  }, [searchParams.id]);

  // 动态测量高度并分页
  useEffect(() => {
    if (!resume) return;

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
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [resume]);

  if (!resume) {
    return <div style={{ padding: 40, background: 'white' }}>正在加载简历数据...</div>;
  }

  const flatElements = getFlatElements(resume);
  const displayPages = pages.length > 0 ? pages : [Array.from({ length: flatElements.length }, (_, i) => i)];

  return (
    <div className="print-wrapper" data-ready={isReady ? 'true' : 'false'}>
      {/* 隐藏的测量沙盒 */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{
          width: A4_W,
          padding: '48px 52px',
          left: -9999,
          top: -9999,
          fontFamily: resume.theme.fontFamily,
          fontSize: `${resume.theme.fontSize}px`,
        }}
      >
        {flatElements}
      </div>

      {/* 真实分页打印 */}
      {displayPages.map((indices, pageIdx) => (
        <div key={pageIdx} className="print-page-container">
          <ClassicTemplate data={resume} elementIndices={indices} />
        </div>
      ))}
    </div>
  );
}
