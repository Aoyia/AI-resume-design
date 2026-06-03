import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 生成唯一 ID（兼容 SSR） */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
