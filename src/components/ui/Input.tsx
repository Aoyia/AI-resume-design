'use client';

import { Input as ArcoInput } from '@arco-design/web-react';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useEffect, useState, useRef } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = forwardRef<any, InputProps>(
  ({ className, label, error, id, value, onChange, onBlur, ...props }, ref) => {
    const inputId = id ?? label;
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

      // 150ms 延迟同步，保证打字极其顺畅
      timerRef.current = setTimeout(() => {
        if (onChangeRef.current) {
          // 模拟原生 Event 对象，确保 e.target.value 可读
          const mockEvent = {
            ...e,
            target: {
              ...e?.target,
              value: val,
            },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
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
        } as unknown as React.ChangeEvent<HTMLInputElement>;
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
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <ArcoInput
          ref={ref}
          id={inputId}
          value={localValue as string}
          onChange={handleLocalChange}
          onBlur={handleBlur}
          status={error ? 'error' : undefined}
          className={cn(
            'w-full bg-slate-50/70 text-sm transition-all duration-200 rounded-[var(--radius-md)] border border-transparent',
            'focus:bg-white'
          )}
          {...(props as any)}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
