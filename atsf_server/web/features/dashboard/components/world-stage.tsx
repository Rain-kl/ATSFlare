'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/feedback/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import type {
  DashboardConfig,
  DashboardNodeHealth,
  DashboardRiskSummary,
  DashboardSummary,
  DistributionItem,
} from '@/features/dashboard/types';
import {
  getNodeStatusLabel,
  getNodeStatusVariant,
  getOpenrestyStatusLabel,
  getOpenrestyStatusVariant,
} from '@/features/nodes/utils';
import { formatDateTime } from '@/lib/utils/date';

const stageAnchors = [
  { left: '16%', top: '24%' },
  { left: '24%', top: '58%' },
  { left: '45%', top: '22%' },
  { left: '52%', top: '54%' },
  { left: '72%', top: '30%' },
  { left: '84%', top: '68%' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)}%`;
}

function buildNodeDetailHref(id?: number | null) {
  if (!id) {
    return '/node';
  }
  return `/node/detail?id=${id}`;
}

function projectNodeCoordinates(node: DashboardNodeHealth, index: number) {
  if (
    typeof node.geo_latitude === 'number' &&
    typeof node.geo_longitude === 'number'
  ) {
    const left = clamp(((node.geo_longitude + 180) / 360) * 100, 8, 92);
    const top = clamp(((90 - node.geo_latitude) / 180) * 100, 12, 78);
    return {
      left: `${left}%`,
      top: `${top}%`,
      derivedFromGeo: true,
    };
  }

  return {
    ...stageAnchors[index % stageAnchors.length],
    derivedFromGeo: false,
  };
}

function getNodeSignalTone(node: DashboardNodeHealth) {
  if (
    node.status === 'offline' ||
    node.openresty_status === 'unhealthy' ||
    node.active_event_count > 0
  ) {
    return {
      dot: 'bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.75)]',
      ring: 'border-rose-400/50 bg-rose-500/12 text-rose-50',
      halo: 'bg-rose-500/20',
    };
  }

  if (
    node.cpu_usage_percent >= 80 ||
    node.memory_usage_percent >= 85 ||
    node.storage_usage_percent >= 85
  ) {
    return {
      dot: 'bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.75)]',
      ring: 'border-amber-300/45 bg-amber-400/12 text-amber-50',
      halo: 'bg-amber-400/18',
    };
  }

  return {
    dot: 'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.7)]',
    ring: 'border-emerald-300/40 bg-emerald-400/12 text-emerald-50',
    halo: 'bg-emerald-400/18',
  };
}

function HeroMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
      <p className="text-[11px] tracking-[0.26em] text-slate-300 uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </div>
  );
}

function SignalLegend() {
  return (
    <div className="absolute right-4 top-4 flex flex-wrap gap-2">
      <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-100">
        绿色: 运行健康
      </div>
      <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-100">
        黄色: 容量压力
      </div>
      <div className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-[11px] text-rose-100">
        红色: 异常或离线
      </div>
    </div>
  );
}

function CountrySignal({
  item,
  index,
}: {
  item: DistributionItem;
  index: number;
}) {
  const accents = [
    'from-sky-400/35 to-cyan-400/10',
    'from-violet-400/35 to-fuchsia-400/10',
    'from-emerald-400/35 to-teal-400/10',
  ];

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br px-4 py-3 backdrop-blur ${accents[index % accents.length]}`}
    >
      <p className="text-[11px] tracking-[0.24em] text-slate-200 uppercase">
        {item.key}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">
        {item.value.toLocaleString('zh-CN')}
      </p>
      <p className="mt-1 text-xs text-slate-300">最近 24 小时来源信号</p>
    </div>
  );
}

export function WorldStage({
  generatedAt,
  summary,
  risk,
  config,
  nodes,
  sourceCountries,
}: {
  generatedAt: string;
  summary: DashboardSummary;
  risk: DashboardRiskSummary;
  config: DashboardConfig;
  nodes: DashboardNodeHealth[];
  sourceCountries: DistributionItem[];
}) {
  const onlineRate =
    summary.total_nodes > 0
      ? (summary.online_nodes / summary.total_nodes) * 100
      : 0;
  const syncedNodes = Math.max(
    0,
    summary.total_nodes - summary.lagging_nodes - summary.pending_nodes,
  );
  const syncRate =
    summary.total_nodes > 0 ? (syncedNodes / summary.total_nodes) * 100 : 0;
  const healthyNodes = Math.max(
    0,
    summary.online_nodes - summary.unhealthy_nodes - risk.offline_nodes,
  );
  const healthyRate =
    summary.total_nodes > 0 ? (healthyNodes / summary.total_nodes) * 100 : 0;
  const geoConfiguredNodes = nodes.filter(
    (node) =>
      typeof node.geo_latitude === 'number' &&
      typeof node.geo_longitude === 'number',
  ).length;
  const signalNodes = nodes.slice(0, Math.max(stageAnchors.length, 8));

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-800/70 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.10),transparent_18%),linear-gradient(135deg,#08111f,#0f172a_45%,#111827)] shadow-[0_32px_80px_rgba(2,6,23,0.35)]">
      <div className="border-b border-white/8 px-6 py-5 md:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.34em] text-sky-200/80 uppercase">
              Global Stage
            </p>
            <h2 className="text-2xl font-semibold text-white">全球态势板</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              先把节点健康、配置追平、活动风险和全球来源信号拉到同一张首屏，
              让总览页真正承担值守入口的职责。
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            数据生成于 {formatDateTime(generatedAt)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 md:px-7 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.16),rgba(15,23,42,0.42))]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35" />
            <div className="absolute left-8 top-8 rounded-full bg-sky-400/20 px-3 py-1 text-[11px] tracking-[0.22em] text-sky-100 uppercase backdrop-blur">
              {geoConfiguredNodes > 0 ? '真实节点点位' : '节点信号覆盖'}
            </div>
            <SignalLegend />

            <svg
              viewBox="0 0 1000 420"
              className="absolute inset-0 h-full w-full opacity-80"
              aria-hidden="true"
            >
              <g fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1.5">
                <path d="M86 98C118 84 168 80 206 92C244 104 270 132 262 154C254 174 210 182 178 180C146 178 108 164 94 142C80 120 76 106 86 98Z" />
                <path d="M246 210C270 220 286 248 282 276C278 304 266 332 252 360C236 352 228 328 220 306C212 282 210 252 220 232C226 220 236 212 246 210Z" />
                <path d="M432 86C456 72 510 70 538 84C566 98 566 122 544 132C524 140 488 138 460 130C436 122 418 100 432 86Z" />
                <path d="M494 154C524 150 552 164 568 188C586 214 592 246 582 274C572 302 546 326 518 326C494 326 474 302 468 276C460 244 458 212 466 186C472 168 480 158 494 154Z" />
                <path d="M574 84C612 64 674 64 724 78C774 92 832 116 860 152C886 186 880 226 846 244C814 262 752 256 704 248C650 238 598 218 574 186C554 158 548 100 574 84Z" />
                <path d="M804 298C824 288 858 290 882 302C904 312 912 332 900 346C888 360 856 364 830 360C806 356 788 338 790 320C792 310 796 302 804 298Z" />
              </g>
              <g stroke="rgba(56,189,248,0.22)" strokeDasharray="6 8">
                <path d="M160 150C274 108 414 102 516 146C652 206 742 170 854 182" />
                <path d="M248 286C358 226 430 206 544 208C668 210 760 256 858 322" />
              </g>
            </svg>

            {signalNodes.length === 0 ? (
              <div className="absolute inset-x-4 bottom-20 top-20 flex items-center justify-center">
                <EmptyState
                  title="暂无节点地图数据"
                  description="节点接入后，首页会在这里展示真实落点、健康颜色和容量风险。"
                />
              </div>
            ) : (
              signalNodes.map((node, index) => {
                const anchor = projectNodeCoordinates(node, index);
                const tone = getNodeSignalTone(node);
                return (
                  <Link
                    key={node.node_id}
                    href={buildNodeDetailHref(node.id)}
                    className={`absolute w-[184px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-4 py-3 backdrop-blur transition hover:scale-[1.02] ${tone.ring}`}
                    style={anchor}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span
                          className={`absolute inset-0 rounded-full blur-md ${tone.halo}`}
                        />
                        <span
                          className={`relative block h-3.5 w-3.5 rounded-full ${tone.dot}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {node.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          {(node.geo_name || node.name) + ' · '}
                          请求 {node.request_count.toLocaleString('zh-CN')} · 异常{' '}
                          {node.active_event_count}
                        </p>
                        {!anchor.derivedFromGeo ? (
                          <p className="mt-1 text-[11px] text-slate-400">
                            未配置经纬度，当前使用备用落点
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}

            <div className="absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
              {sourceCountries.length > 0 ? (
                sourceCountries.slice(0, 3).map((item, index) => (
                  <CountrySignal
                    key={`${item.key}-${item.value}`}
                    item={item}
                    index={index}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300 md:col-span-3">
                  当前还没有可用于全球分布展示的来源国家数据。
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-slate-300 backdrop-blur">
            当前已有 {geoConfiguredNodes}/{summary.total_nodes} 个节点配置了真实地图坐标。
            未配置坐标的节点仍会使用备用落点，不影响首页态势判断。
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <HeroMetric
              label="在线覆盖"
              value={formatPercent(onlineRate)}
              hint={`${summary.online_nodes}/${summary.total_nodes} 节点在线`}
            />
            <HeroMetric
              label="运行健康"
              value={formatPercent(healthyRate)}
              hint={`${summary.unhealthy_nodes} 个 OpenResty 不健康`}
            />
            <HeroMetric
              label="配置追平"
              value={formatPercent(syncRate)}
              hint={`${summary.lagging_nodes} 个节点未追平 ${config.active_version || '当前激活版本'}`}
            />
            <HeroMetric
              label="活动风险"
              value={summary.active_alerts.toLocaleString('zh-CN')}
              hint={`${risk.critical_alerts} Critical · ${risk.warning_alerts} Warning`}
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-slate-300 uppercase">
                  节点健康清单
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  风险优先队列
                </p>
              </div>
              <Link
                href="/node"
                className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/8"
              >
                查看全部节点
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {nodes.slice(0, 4).map((node) => (
                <Link
                  key={node.node_id}
                  href={buildNodeDetailHref(node.id)}
                  className="block rounded-2xl border border-white/8 bg-slate-950/20 px-4 py-4 transition hover:border-white/18 hover:bg-white/6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {node.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        请求 {node.request_count.toLocaleString('zh-CN')} · 错误{' '}
                        {node.error_count.toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusBadge
                        label={getNodeStatusLabel(node.status)}
                        variant={getNodeStatusVariant(node.status)}
                      />
                      <StatusBadge
                        label={getOpenrestyStatusLabel(node.openresty_status)}
                        variant={getOpenrestyStatusVariant(
                          node.openresty_status,
                        )}
                      />
                    </div>
                  </div>
                </Link>
              ))}
              {nodes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/12 bg-slate-950/20 px-4 py-5 text-sm text-slate-300">
                  当前没有节点健康数据，等节点开始 heartbeat 后这里会出现世界覆盖信号。
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
