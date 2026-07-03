'use client';

import Toolbar from '@/components/editor/Toolbar';
import EditorPanel from '@/components/editor/EditorPanel';
import PreviewPanel from '@/components/editor/PreviewPanel';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 260;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export default function EditorPage() {
  const [editorWidth, setEditorWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editor_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed));
      }
    }
    return DEFAULT_WIDTH;
  });
  const authorized = true;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const resizerRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = editorWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    if (asideRef.current) {
      asideRef.current.style.transition = 'none';
    }
    e.preventDefault();
  }, [editorWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      if (asideRef.current) {
        asideRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      if (asideRef.current) {
        asideRef.current.style.transition = 'width 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s';
      }

      const finalDelta = e.clientX - startX.current;
      const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + finalDelta));
      setEditorWidth(finalWidth);
      localStorage.setItem('editor_width', String(finalWidth));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleStartEdit = () => {
    // 无密码保护，直接进入编辑
  };

  const handleLogout = () => {
    // 无需注销逻辑
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <Toolbar 
        authorized={authorized} 
        onStartEdit={handleStartEdit} 
        onLogout={handleLogout} 
      />
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑面板 */}
        <aside
          ref={asideRef}
          style={{ 
            width: editorWidth,
            opacity: 1,
            visibility: 'visible',
            transition: 'width 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s'
          }}
          className="shrink-0 border-r border-[var(--border)] bg-white overflow-hidden flex flex-col"
        >
          <EditorPanel />
        </aside>

        {/* 可拖拽分割条 */}
        <div
          ref={resizerRef}
          onMouseDown={onMouseDown}
          className="group relative w-1 shrink-0 bg-[var(--border)] hover:bg-[var(--primary)] transition-colors duration-150 cursor-col-resize z-10 flex items-center justify-center"
          title="拖动以调整面板宽度"
        >
          {/* 拖动时的高亮指示条 */}
          <div className="absolute inset-y-0 -left-1 -right-1" />
          {/* 中央拖动把手点 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col gap-0.5 pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
            <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
            <div className="w-1 h-1 rounded-full bg-[var(--primary)]" />
          </div>
        </div>

        {/* 右侧预览面板 */}
        <main className="flex-1 overflow-hidden min-w-0 bg-slate-100">
          <PreviewPanel 
            authorized={authorized} 
            onStartEdit={handleStartEdit} 
          />
        </main>
      </div>
    </div>
  );
}
