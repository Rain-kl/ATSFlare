'use client';

import { useId } from 'react';

import { calculateNiceAxisMax, formatCompactNumber } from '@/lib/utils/metrics';

type TrendSeries = {
  label: string;
  color: string;
  values: number[];
  fillColor?: string;
  variant?: 'line' | 'area';
  valueFormatter?: (value: number) => string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildPath(points: Array<[number, number]>) {
  if (points.length === 0) {
    return '';
  }

  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
}

export function TrendChart({
  labels,
  series,
  height = 240,
  yAxisValueFormatter = formatCompactNumber,
}: {
  labels: string[];
  series: TrendSeries[];
  height?: number;
  yAxisValueFormatter?: (value: number) => string;
}) {
  const chartId = useId();
  const width = 720;
  const paddingTop = 18;
  const paddingRight = 18;
  const paddingBottom = 42;
  const paddingLeft = 54;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const normalizedSeries = series.filter((entry) =>
    entry.values.some((value) => Number.isFinite(value)),
  );
  const pointCount = Math.max(
    labels.length,
    ...normalizedSeries.map((entry) => entry.values.length),
    0,
  );
  const allValues = normalizedSeries.flatMap((entry) =>
    entry.values.filter((value) => Number.isFinite(value)),
  );
  const axisMax = calculateNiceAxisMax(allValues);
  const yTicks = 4;

  if (normalizedSeries.length === 0 || pointCount === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface-elevated)] px-6 py-8 text-sm text-[var(--foreground-muted)]">
        暂无趋势数据
      </div>
    );
  }

  const xStep = pointCount > 1 ? innerWidth / (pointCount - 1) : innerWidth / 2;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="趋势图"
        >
          {Array.from({ length: yTicks + 1 }, (_, index) => {
            const value = axisMax - (axisMax / yTicks) * index;
            const y = paddingTop + (innerHeight / yTicks) * index;

            return (
              <g key={`tick-${index}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border-default)"
                  strokeDasharray="4 6"
                  strokeOpacity="0.7"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--foreground-muted)"
                >
                  {yAxisValueFormatter(value)}
                </text>
              </g>
            );
          })}

          {labels.map((label, index) => {
            const x =
              pointCount > 1
                ? paddingLeft + xStep * index
                : paddingLeft + innerWidth / 2;

            return (
              <text
                key={`${label}-${index}`}
                x={x}
                y={height - 14}
                textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}
                fontSize="11"
                fill="var(--foreground-muted)"
              >
                {label}
              </text>
            );
          })}

          {normalizedSeries.map((entry, seriesIndex) => {
            const points = entry.values.map((value, index) => {
              const x =
                pointCount > 1
                  ? paddingLeft + xStep * index
                  : paddingLeft + innerWidth / 2;
              const safeValue = Number.isFinite(value) ? value : 0;
              const y =
                paddingTop +
                innerHeight -
                (clamp(safeValue, 0, axisMax) / axisMax) * innerHeight;
              return [x, y] as [number, number];
            });

            const linePath = buildPath(points);
            const areaPath =
              points.length > 0
                ? `${linePath} L ${points[points.length - 1][0]} ${paddingTop + innerHeight} L ${points[0][0]} ${paddingTop + innerHeight} Z`
                : '';
            const gradientId = `${chartId}-gradient-${seriesIndex}`;

            return (
              <g key={`${entry.label}-${seriesIndex}`}>
                {entry.variant === 'area' && entry.fillColor ? (
                  <>
                    <defs>
                      <linearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={entry.fillColor} />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                  </>
                ) : null}

                <path
                  d={linePath}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {points.map(([x, y], pointIndex) => {
                  const value = entry.values[pointIndex] ?? 0;
                  const label = labels[pointIndex] ?? `点 ${pointIndex + 1}`;
                  const formatter = entry.valueFormatter ?? yAxisValueFormatter;

                  return (
                    <circle key={`${entry.label}-${pointIndex}`} cx={x} cy={y} r="3.5" fill={entry.color}>
                      <title>{`${entry.label} · ${label} · ${formatter(value)}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-3">
        {normalizedSeries.map((entry) => (
          <div
            key={entry.label}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs text-[var(--foreground-secondary)]"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </div>
        ))}
      </div>
    </div>
  );
}
