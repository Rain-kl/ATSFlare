'use client';

import { formatCompactNumber } from '@/lib/utils/metrics';

type RankChartItem = {
  label: string;
  value: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function RankChart({
  items,
  color,
  valueFormatter = formatCompactNumber,
  emptyMessage = '暂无数据',
}: {
  items: RankChartItem[];
  color: string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
}) {
  const validItems = items.filter(
    (item) => item.label.trim() !== '' && Number.isFinite(item.value),
  );
  const maxValue = Math.max(1, ...validItems.map((item) => item.value));

  if (validItems.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] px-6 py-8 text-sm text-[var(--foreground-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {validItems.map((item, index) => {
        const width = clamp((item.value / maxValue) * 100, 6, 100);

        return (
          <div
            key={`${item.label}-${index}`}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs tracking-[0.18em] text-[var(--foreground-muted)] uppercase">
                  #{index + 1}
                </p>
                <p className="mt-2 truncate text-sm font-medium text-[var(--foreground-primary)]">
                  {item.label}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--foreground-primary)]">
                {valueFormatter(item.value)}
              </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 24px ${color}33`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
