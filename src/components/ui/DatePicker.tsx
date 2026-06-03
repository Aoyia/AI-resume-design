'use client';

import { DatePicker as ArcoDatePicker, Checkbox } from '@arco-design/web-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface MonthPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPresent?: boolean; // 是否在右上角展示“至今”复选框
}

export default function MonthPicker({
  label,
  value,
  onChange,
  placeholder = '选择月份',
  className,
  showPresent = false,
}: MonthPickerProps) {
  const isPresent = value === '至今';

  const handleDateChange = (dateStr: string) => {
    onChange(dateStr);
  };

  const handlePresentChange = (checked: boolean) => {
    if (checked) {
      onChange('至今');
    } else {
      onChange('');
    }
  };

  // MonthPicker value 可以是一个 dayjs 对象或 YYYY.MM 格式字符串。如果 value 是 "至今"，MonthPicker 应该传为 undefined 且禁用。
  const pickerValue = value && !isPresent ? dayjs(value, 'YYYY.MM') : undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex justify-between items-center h-4 mb-0.5">
        {label && (
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        {showPresent && (
          <Checkbox
            checked={isPresent}
            onChange={handlePresentChange}
            className="text-xs text-[var(--text-secondary)] scale-90 -mr-1 font-semibold"
          >
            至今
          </Checkbox>
        )}
      </div>

      <ArcoDatePicker.MonthPicker
        format="YYYY.MM"
        value={pickerValue}
        onChange={handleDateChange}
        disabled={isPresent}
        placeholder={isPresent ? '至今' : placeholder}
      />
    </div>
  );
}
