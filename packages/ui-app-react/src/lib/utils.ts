import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with `clsx` + `tailwind-merge` so conflicting
 * Tailwind utilities resolve to the last-specified one.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
