'use client';

import Toolbar from '@/components/editor/Toolbar';
import EditorPanel from '@/components/editor/EditorPanel';
import PreviewPanel from '@/components/editor/PreviewPanel';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 260;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export default function EditorPage() {
  const [editorWidth, setEditorWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const resizerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = editorWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [editorWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setEditorWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑面板 */}
        <aside
          style={{ width: editorWidth }}
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
        <main className="flex-1 overflow-hidden min-w-0">
          <PreviewPanel />
        </main>
      </div>
    </div>
  );
}
