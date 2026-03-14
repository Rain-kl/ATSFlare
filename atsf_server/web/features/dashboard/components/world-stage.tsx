'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { useTheme } from '@/components/providers/theme-provider';
import type {
  DashboardCapacity,
  DashboardNodeHealth,
  DashboardSummary,
  DashboardTraffic,
  DistributionItem,
} from '@/features/dashboard/types';
import { cn } from '@/lib/utils/cn';

type Tone = 'healthy' | 'warning' | 'danger';

const WorldStageMap = dynamic(
  () =>
    import('@/features/dashboard/components/world-stage-map').then(
      (module) => module.WorldStageMap,
    ),
  { ssr: false },
);

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)}%`;
}

function HeroMetric({
  label,
  value,
  hint,
  isDark,
}: {
  label: string;
  value: string;
  hint: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[24px] border px-5 py-5 backdrop-blur',
        isDark
          ? 'border-white/10 bg-white/6'
          : 'border-sky-100/90 bg-white/80 shadow-[0_18px_40px_rgba(148,163,184,0.12)]',
      )}
    >
      <p
        className={cn(
          'text-[11px] tracking-[0.26em] uppercase',
          isDark ? 'text-slate-300' : 'text-slate-500',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-3 text-[30px] font-semibold leading-none',
          isDark ? 'text-white' : 'text-slate-950',
        )}
      >
        {value}
      </p>
      <p className={cn('mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
        {hint}
      </p>
    </div>
  );
}

function LegendPill({
  label,
  tone,
  isDark,
}: {
  label: string;
  tone: Tone;
  isDark: boolean;
}) {
  const toneClass =
    tone === 'healthy'
      ? isDark
        ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? isDark
          ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
          : 'border-amber-200 bg-amber-50 text-amber-700'
        : isDark
          ? 'border-rose-300/20 bg-rose-400/10 text-rose-100'
          : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className={cn('rounded-full border px-3 py-1 text-[11px]', toneClass)}>
      {label}
    </div>
  );
}

function CountrySignal({
  item,
  index,
  isDark,
}: {
  item: DistributionItem;
  index: number;
  isDark: boolean;
}) {
  const darkAccents = [
    'from-sky-400/35 to-cyan-400/10',
    'from-violet-400/35 to-fuchsia-400/10',
    'from-emerald-400/35 to-teal-400/10',
  ];
  const lightAccents = [
    'from-sky-100 via-white to-cyan-50',
    'from-indigo-100 via-white to-fuchsia-50',
    'from-emerald-100 via-white to-teal-50',
  ];

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br px-4 py-3 backdrop-blur',
        isDark
          ? `border-white/10 ${darkAccents[index % darkAccents.length]}`
          : `border-slate-200/80 ${lightAccents[index % lightAccents.length]} shadow-[0_14px_30px_rgba(148,163,184,0.12)]`,
      )}
    >
      <p
        className={cn(
          'text-[11px] tracking-[0.24em] uppercase',
          isDark ? 'text-slate-200' : 'text-slate-500',
        )}
      >
        {item.key}
      </p>
      <p
        className={cn(
          'mt-2 text-lg font-semibold',
          isDark ? 'text-white' : 'text-slate-950',
        )}
      >
        {item.value.toLocaleString('zh-CN')}
      </p>
      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
        最近 24 小时来源信号
      </p>
    </div>
  );
}

export function WorldStage({
  summary,
  traffic,
  capacity,
  nodes,
  sourceCountries,
}: {
  summary: DashboardSummary;
  traffic: DashboardTraffic;
  capacity: DashboardCapacity;
  nodes: DashboardNodeHealth[];
  sourceCountries: DistributionItem[];
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);

  useEffect(() => {
    if (shouldRenderMap) {
      return;
    }

    const mapViewport = mapViewportRef.current;
    if (!mapViewport || typeof IntersectionObserver === 'undefined') {
      setShouldRenderMap(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px 0px' },
    );

    observer.observe(mapViewport);

    return () => {
      observer.disconnect();
    };
  }, [shouldRenderMap]);

  const onlineRate =
    summary.total_nodes > 0
      ? (summary.online_nodes / summary.total_nodes) * 100
      : 0;
  const healthyNodes = Math.max(
    0,
    summary.online_nodes - summary.unhealthy_nodes,
  );
  const healthyRate =
    summary.total_nodes > 0 ? (healthyNodes / summary.total_nodes) * 100 : 0;
  const geoConfiguredNodes = nodes.filter(
    (node) =>
      typeof node.geo_latitude === 'number' &&
      typeof node.geo_longitude === 'number',
  ).length;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-[32px] border transition-colors',
        isDark
          ? 'border-slate-800/70 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.10),transparent_18%),linear-gradient(135deg,#08111f,#0f172a_45%,#111827)] shadow-[0_32px_80px_rgba(2,6,23,0.35)]'
          : 'border-sky-100/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.12),transparent_20%),linear-gradient(135deg,#f8fbff,#edf5ff_45%,#ffffff)] shadow-[0_32px_80px_rgba(148,163,184,0.18)]',
      )}
    >
      <div
        className={cn(
          'border-b px-6 py-6 md:px-7 md:py-7',
          isDark ? 'border-white/8' : 'border-slate-200/70',
        )}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <p
              className={cn(
                  'text-[11px] tracking-[0.34em] uppercase',
                  isDark ? 'text-sky-200/80' : 'text-sky-700/80',
              )}
          >
            Global Stage
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-7 md:px-7 md:py-8 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          <div
            className={cn(
              'relative min-h-[540px] overflow-hidden rounded-[28px] border py-6 lg:min-h-[600px]',
              isDark
                ? 'border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.16),rgba(15,23,42,0.42))]'
                : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(239,246,255,0.92))]',
            )}
          >
            <div
              className={cn(
                'absolute left-6 top-6 z-10 rounded-full px-3 py-1 text-[11px] tracking-[0.22em] uppercase backdrop-blur',
                isDark
                  ? 'bg-sky-400/20 text-sky-100'
                  : 'bg-sky-100/90 text-sky-700',
              )}
            >
              {geoConfiguredNodes > 0 ? '节点地理坐标' : '节点覆盖信号'}
            </div>

            <div className="absolute right-4 top-4 z-10 flex flex-wrap gap-2">
              <LegendPill label="绿色: 运行正常" tone="healthy" isDark={isDark} />
              <LegendPill label="黄色: 资源承压" tone="warning" isDark={isDark} />
              <LegendPill label="红色: 异常待处理" tone="danger" isDark={isDark} />
            </div>

            <div
              ref={mapViewportRef}
              className="absolute inset-x-3 top-16 bottom-28 flex items-center justify-center md:inset-x-4 md:top-18 md:bottom-32"
            >
              <div className="h-full max-w-full aspect-[2/1]">
                {shouldRenderMap ? (
                  <WorldStageMap isDark={isDark} nodes={nodes} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      title="全球地图准备中"
                      description="地图会在进入可视区域后再加载，避免首页滚动和交互被首屏图表拖慢。"
                    />
                  </div>
                )}
              </div>
            </div>

            {shouldRenderMap && nodes.length === 0 ? (
              <div className="pointer-events-none absolute inset-x-6 bottom-28 z-10">
                <div
                  className={cn(
                    'rounded-2xl border border-dashed px-4 py-4 text-sm backdrop-blur',
                    isDark
                      ? 'border-white/15 bg-white/5 text-slate-300'
                      : 'border-slate-300/70 bg-white/78 text-slate-600',
                  )}
                >
                  当前暂无节点接入。地图已完成初始化，后续会在这里展示节点位置与健康状态。
                </div>
              </div>
            ) : null}

            <div className="absolute bottom-6 left-4 right-4 z-10 grid gap-3 md:grid-cols-3">
              {sourceCountries.length > 0 ? (
                sourceCountries.slice(0, 3).map((item, index) => (
                  <CountrySignal
                    key={`${item.key}-${item.value}`}
                    item={item}
                    index={index}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div
                  className={cn(
                    'rounded-2xl border border-dashed px-4 py-4 text-sm backdrop-blur md:col-span-3',
                    isDark
                      ? 'border-white/15 bg-white/5 text-slate-300'
                      : 'border-slate-300/70 bg-white/78 text-slate-600',
                  )}
                >
                  暂无可用于全球来源展示的国家分布数据。
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              'rounded-[24px] border px-5 py-4 text-xs leading-6 backdrop-blur',
              isDark
                ? 'border-white/10 bg-white/5 text-slate-300'
                : 'border-slate-200/80 bg-white/80 text-slate-600',
            )}
          >
            当前已有 {geoConfiguredNodes}/{summary.total_nodes} 个节点配置了地理坐标。
            未配置坐标的节点会映射到预设城市点位，用于维持全球覆盖视图的连续性。
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <HeroMetric
              label="在线覆盖"
              value={formatPercent(onlineRate)}
              hint={`${summary.online_nodes}/${summary.total_nodes} 个节点在线`}
              isDark={isDark}
            />
            <HeroMetric
              label="运行健康"
              value={formatPercent(healthyRate)}
              hint={`${summary.unhealthy_nodes} 个节点存在 OpenResty 异常`}
              isDark={isDark}
            />
            <HeroMetric
              label="最近窗口请求"
              value={traffic.request_count.toLocaleString('zh-CN')}
              hint={`QPS ${traffic.estimated_qps.toFixed(1)} · ${traffic.reported_nodes} 个节点已上报`}
              isDark={isDark}
            />
            <HeroMetric
              label="平均 CPU"
              value={formatPercent(capacity.average_cpu_usage_percent)}
              hint={`${capacity.high_cpu_nodes} 个节点 CPU 偏高`}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
