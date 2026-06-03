'use client';

import { Input as ArcoInput } from '@arco-design/web-react';
import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef, useEffect, useState, useRef } from 'react';

const ArcoTextArea = ArcoInput.TextArea;

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
  label?: string;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const Textarea = forwardRef<any, TextareaProps>(
  ({ className, label, hint, id, rows = 4, value, onChange, onBlur, onKeyDown, ...props }, ref) => {
    const textareaId = id ?? label;
    const [localValue, setLocalValue] = useState(value ?? '');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onChangeRef = useRef(onChange);

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

    const handleLocalChange = (val: string, e: any) => {
      setLocalValue(val);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 150ms 延迟同步，保证打字极其顺畅，同时预览反应灵敏
      timerRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          const mockEvent = {
            ...e,
            target: {
              ...e?.target,
              value: val,
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
          ...e,
          target: {
            ...e?.target,
            value: localValue,
          },
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
        onChangeRef.current(mockEvent);
      }
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMac = typeof window !== 'undefined' && /macintosh|mac os x/i.test(navigator.userAgent);
      const isBoldKey = isMac 
        ? (e.metaKey && e.key.toLowerCase() === 'b') 
        : (e.ctrlKey && e.key.toLowerCase() === 'b');

      if (isBoldKey) {
        e.preventDefault();
        const textarea = e.currentTarget;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;

          const selectedText = text.substring(start, end);

          let newText = '';
          let newSelectionStart = start;
          let newSelectionEnd = end;

          // 情况1: 选中的文本本身前后就是 ** 包裹
          if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
            const unwrapped = selectedText.slice(2, -2);
            newText = text.substring(0, start) + unwrapped + text.substring(end);
            newSelectionStart = start;
            newSelectionEnd = end - 4;
          } 
          // 情况2: 选中的文本外部被 ** 包裹
          else if (
            start >= 2 &&
            end <= text.length - 2 &&
            text.substring(start - 2, start) === '**' &&
            text.substring(end, end + 2) === '**'
          ) {
            const unwrapped = selectedText;
            newText = text.substring(0, start - 2) + unwrapped + text.substring(end + 2);
            newSelectionStart = start - 2;
            newSelectionEnd = end - 2;
          } 
          // 情况3: 没有加粗，添加 ** 包裹
          else {
            newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
            newSelectionStart = start + 2;
            newSelectionEnd = end + 2;
          }

          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          setLocalValue(newText);

          if (onChangeRef.current) {
            const mockEvent = {
              ...e,
              target: {
                ...e.target,
                value: newText,
              },
            } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
            onChangeRef.current(mockEvent);
          }

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
          }, 0);
        }
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    // 组件卸载时清理定时器
    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    return (
      <div className="flex flex-col gap-1">
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
        <ArcoTextArea
          ref={ref}
          id={textareaId}
          autoSize={{ minRows: rows, maxRows: rows + 4 }}
          value={localValue as string}
          onChange={handleLocalChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full bg-slate-50/70 text-sm transition-all duration-200 rounded-[var(--radius-md)] border border-transparent font-mono leading-relaxed',
            'focus:bg-white',
            className
          )}
          {...(props as any)}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
