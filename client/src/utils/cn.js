import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 * Combines clsx & tailwind-merge for clean, deduped class strings.
 *
 * @example cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6')
 * // → 'py-2 px-6 bg-blue-500'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
