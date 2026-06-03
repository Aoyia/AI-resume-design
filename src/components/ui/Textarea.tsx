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
  ({ className, label, hint, id, rows = 4, value, onChange, onBlur, ...props }, ref) => {
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
