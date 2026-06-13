'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, Pencil } from 'lucide-react';
import { useState, ReactNode, useRef, useEffect } from 'react';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  /** 右侧附加操作按钮（如"添加"按钮） */
  action?: ReactNode;
  /** 是否显示拖拽手柄（由父级传入） */
  dragHandle?: ReactNode;
  /** 标题修改回调 */
  onTitleChange?: (newTitle: string) => void;
  open?: boolean; // 新增：外部受控状态
  onOpenChange?: (open: boolean) => void; // 新增：折叠展开回调
}

export default function Accordion({
  title,
  defaultOpen = true,
  className,
  children,
  action,
  dragHandle,
  onTitleChange,
  open: controlledOpen,
  onOpenChange,
}: AccordionProps) {
  const [isOpenState, setIsOpenState] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(title);
  const contentRef = useRef<HTMLDivElement>(null);

  const isOpened = controlledOpen !== undefined ? controlledOpen : isOpenState;

  const handleToggle = () => {
    const nextState = !isOpened;
    if (controlledOpen === undefined) {
      setIsOpenState(nextState);
    }
    onOpenChange?.(nextState);
  };

  useEffect(() => {
    setEditingText(title);
  }, [title]);

  return (
    <div className={cn('group border-b border-slate-100/80', className)}>
      {/* 标题栏 */}
      <div
        className="flex items-center gap-2 select-none cursor-pointer py-2.5 px-1"
        onClick={() => !isEditing && handleToggle()}
      >
        {dragHandle && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[var(--text-muted)] cursor-grab active:cursor-grabbing shrink-0 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {dragHandle}
          </div>
        )}
        {isEditing ? (
          <input
            type="text"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              if (editingText.trim() && editingText !== title) {
                onTitleChange?.(editingText.trim());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                if (editingText.trim() && editingText !== title) {
                  onTitleChange?.(editingText.trim());
                }
              } else if (e.key === 'Escape') {
                setIsEditing(false);
                setEditingText(title);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 text-sm font-semibold text-[var(--text-primary)] border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent min-w-[100px]"
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5 group/title">
            {title}
            {onTitleChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer focus:outline-none flex items-center shrink-0"
                title="编辑模块名称"
              >
                <Pencil size={12} />
              </button>
            )}
          </span>
        )}
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
        <ChevronDown
          size={15}
          className={cn(
            'text-[var(--text-muted)] opacity-30 group-hover:opacity-100 transition-all duration-200 shrink-0',
            isOpened && 'rotate-180'
          )}
        />
      </div>

      {/* 内容区（高度过渡动画） */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isOpened ? '2000px' : '0px',
          opacity: isOpened ? 1 : 0,
          visibility: isOpened ? 'visible' : 'hidden',
        }}
      >
        <div className="px-1 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}
