'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, ReactNode, useRef } from 'react';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  /** 右侧附加操作按钮（如"添加"按钮） */
  action?: ReactNode;
  /** 是否显示拖拽手柄（由父级传入） */
  dragHandle?: ReactNode;
}

export default function Accordion({
  title,
  defaultOpen = true,
  className,
  children,
  action,
  dragHandle,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn('group border-b border-slate-100/80', className)}>
      {/* 标题栏 */}
      <div
        className="flex items-center gap-2 select-none cursor-pointer py-2.5 px-1"
        onClick={() => setOpen((v) => !v)}
      >
        {dragHandle && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[var(--text-muted)] cursor-grab active:cursor-grabbing shrink-0 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {dragHandle}
          </div>
        )}
        <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
        <ChevronDown
          size={15}
          className={cn(
            'text-[var(--text-muted)] opacity-30 group-hover:opacity-100 transition-all duration-200 shrink-0',
            open && 'rotate-180'
          )}
        />
      </div>

      {/* 内容区（高度过渡动画） */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: open ? '2000px' : '0px',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        <div className="px-1 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}
