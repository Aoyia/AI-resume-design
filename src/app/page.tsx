'use client';

import Toolbar from '@/components/editor/Toolbar';
import EditorPanel from '@/components/editor/EditorPanel';
import PreviewPanel from '@/components/editor/PreviewPanel';
import PasswordGate from '@/components/editor/PasswordGate';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 260;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export default function EditorPage() {
  const [editorWidth, setEditorWidth] = useState(DEFAULT_WIDTH);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const resizerRef = useRef<HTMLDivElement>(null);

  // 挂载时检查本地 LocalStorage 授权情况
  useEffect(() => {
    const saved = localStorage.getItem('resume_sys_auth');
    const correctPassword = process.env.NEXT_PUBLIC_PAGE_PASSWORD || 'resume2026';
    if (saved && atob(saved) === correctPassword) {
      setAuthorized(true);
    }
    setChecking(false);
  }, []);

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

  const handleStartEdit = () => {
    setIsPasswordModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('resume_sys_auth');
    setAuthorized(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {authorized && !checking && (
        <Toolbar 
          authorized={authorized} 
          onStartEdit={handleStartEdit} 
          onLogout={handleLogout} 
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑面板 */}
        <aside
          style={{ 
            width: authorized && !checking ? editorWidth : 0,
            opacity: authorized && !checking ? 1 : 0,
            visibility: authorized && !checking ? 'visible' : 'hidden',
            transition: 'width 0.25s ease-out, opacity 0.2s ease-out, visibility 0.25s'
          }}
          className="shrink-0 border-r border-[var(--border)] bg-white overflow-hidden flex flex-col"
        >
          <EditorPanel />
        </aside>

        {/* 可拖拽分割条 */}
        {authorized && !checking && (
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
        )}

        {/* 右侧预览面板 */}
        <main className="flex-1 overflow-hidden min-w-0 bg-slate-100">
          <PreviewPanel 
            authorized={authorized && !checking} 
            onStartEdit={handleStartEdit} 
          />
        </main>
      </div>

      {/* 专属密码校验弹窗 */}
      {isPasswordModalOpen && (
        <PasswordGate 
          onSuccess={() => {
            setAuthorized(true);
            setIsPasswordModalOpen(false);
          }} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      )}
    </div>
  );
}
