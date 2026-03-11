import { cn } from '@/lib/utils/cn';

const variantClasses = {
  success:
    'border-[var(--status-success-border)] bg-[var(--status-success-soft)] text-[var(--status-success-foreground)]',
  warning:
    'border-[var(--status-warning-border)] bg-[var(--status-warning-soft)] text-[var(--status-warning-foreground)]',
  danger:
    'border-[var(--status-danger-border)] bg-[var(--status-danger-soft)] text-[var(--status-danger-foreground)]',
  info:
    'border-[var(--status-info-border)] bg-[var(--status-info-soft)] text-[var(--status-info-foreground)]',
} as const;

interface StatusBadgeProps {
  label: string;
  variant?: keyof typeof variantClasses;
  className?: string;
}

export function StatusBadge({
  label,
  variant = 'info',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
