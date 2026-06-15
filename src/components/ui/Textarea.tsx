'use client';

import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef, useEffect, useState, useRef } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
  label?: string;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const Textarea = forwardRef<any, TextareaProps>(
  ({ className, label, hint, id, rows = 4, value, onChange, onBlur, ...props }, ref) => {
    const textareaId = id ?? label;
    const [localValue, setLocalValue] = useState(value ?? '');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onChangeRef = useRef(onChange);
    const [mounted, setMounted] = useState(false);

    // 解决 Next.js SSR 水合不一致问题，挂载后再渲染 MDEditor
    useEffect(() => {
      setMounted(true);
    }, []);

    // 保持对最新 onChange 的引用
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // 当外部传入的 value 改变时同步
    useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value);
      }
    }, [value]);

    const handleLocalChange = (val?: string) => {
      setLocalValue(val ?? '');

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 150ms 延迟同步，保证打字流畅，同时预览反应灵敏
      timerRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          const mockEvent = {
            target: {
              value: val ?? '',
            },
          } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
          onChangeRef.current(mockEvent);
        }
      }, 150);
    };

    const handleBlur = (e: any) => {
      // 失焦时如果还有未完成的同步，立即执行
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (onChangeRef.current && localValue !== value) {
        const mockEvent = {
          target: {
            value: localValue,
          },
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
        onChangeRef.current(mockEvent);
      }
      if (onBlur) {
        onBlur(e);
      }
    };

    // 组件卸载时清理定时器
    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    // 骨架屏：首屏预渲染或未挂载时使用，避免 SSR 报错并提供优美过渡
    if (!mounted) {
      return (
        <div className={cn('flex flex-col gap-1', className)}>
          {(label || hint) && (
            <div className="flex items-center justify-between">
              {label && (
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  {label}
                </label>
              )}
              {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
            </div>
          )}
          <div 
            className="w-full bg-slate-50/70 border border-slate-200/50 rounded-[var(--radius-md)] animate-pulse" 
            style={{ height: `${rows * 26 + 36}px` }}
          />
        </div>
      );
    }

    // 限制工具栏，扩展简历常用的 Markdown 操作
    const customCommands = [
      commands.bold,
      commands.italic,
      commands.strikethrough,
      commands.divider,
      commands.link,
      commands.quote,
      commands.code,
      commands.codeBlock,
      commands.divider,
      commands.unorderedListCommand,
      commands.orderedListCommand,
      commands.checkedListCommand,
      commands.divider,
      commands.hr,
    ];

    return (
      <div data-color-mode="light" className={cn('flex flex-col gap-1', className)}>
        {(label || hint) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={textareaId} className="text-xs font-medium text-[var(--text-secondary)]">
                {label}
              </label>
            )}
            {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
          </div>
        )}
        <MDEditor
          value={localValue as string}
          onChange={handleLocalChange}
          preview="edit"
          extraCommands={[]}
          commands={customCommands}
          height={rows * 26 + 36}
          textareaProps={{
            id: textareaId,
            placeholder: props.placeholder,
            onBlur: handleBlur,
            ref: ref
          }}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
