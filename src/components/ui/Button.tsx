'use client';

import { Button as ArcoButton } from '@arco-design/web-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'type'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  type?: 'submit' | 'button' | 'reset';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, type = 'button', ...props }, ref) => {
    // 映射 variant 到 Arco 的 type 和 status
    let arcoType: 'primary' | 'secondary' | 'dashed' | 'outline' | 'text' = 'primary';
    let arcoStatus: 'warning' | 'danger' | 'success' | undefined = undefined;

    switch (variant) {
      case 'primary':
        arcoType = 'primary';
        break;
      case 'secondary':
        arcoType = 'secondary';
        break;
      case 'ghost':
        arcoType = 'text';
        break;
      case 'danger':
        arcoType = 'primary';
        arcoStatus = 'danger';
        break;
      case 'light':
        arcoType = 'outline';
        break;
    }

    // 映射 size
    let arcoSize: 'mini' | 'small' | 'default' | 'large' = 'default';
    switch (size) {
      case 'sm':
        arcoSize = 'small';
        break;
      case 'md':
        arcoSize = 'default';
        break;
      case 'lg':
        arcoSize = 'large';
        break;
    }

    return (
      <ArcoButton
        ref={ref as any}
        type={arcoType}
        status={arcoStatus}
        size={arcoSize}
        loading={loading}
        disabled={disabled}
        htmlType={type}
        className={cn(
          '!inline-flex !items-center !justify-center gap-1.5 whitespace-nowrap',
          className
        )}
        {...(props as any)}
      >
        {children}
      </ArcoButton>
    );
  }
);

Button.displayName = 'Button';
export default Button;
