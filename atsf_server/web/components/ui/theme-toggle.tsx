'use client';

import { cn } from '@/lib/utils/cn';
import type { ThemeMode } from '@/lib/theme/theme';
import { useTheme } from '@/components/providers/theme-provider';

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: '浅色' },
  { value: 'system', label: '跟随系统' },
  { value: 'dark', label: '深色' },
];

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--control-background)] p-1 text-xs text-[var(--foreground-secondary)]',
        className,
      )}
      aria-label='主题切换'
    >
      {themeOptions.map((option) => {
        const active = themeMode === option.value;

        return (
          <button
            key={option.value}
            type='button'
            onClick={() => setThemeMode(option.value)}
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors',
              active
                ? 'bg-[var(--accent-soft)] text-[var(--foreground-primary)]'
                : 'hover:bg-[var(--control-background-hover)] hover:text-[var(--foreground-primary)]',
            )}
            aria-pressed={active}
            title={
              option.value === 'system'
                ? `当前跟随系统（${resolvedTheme === 'dark' ? '深色' : '浅色'}）`
                : `切换到${option.label}`
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
