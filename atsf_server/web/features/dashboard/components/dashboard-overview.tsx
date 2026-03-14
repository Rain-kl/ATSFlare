'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { TrendChart } from '@/components/data/trend-chart';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDashboardOverview } from '@/features/dashboard/api/overview';
import type {
  DashboardAlert,
  DashboardNodeHealth,
} from '@/features/dashboard/types';
import {
  getNodeStatusLabel,
  getNodeStatusVariant,
  getOpenrestyStatusLabel,
  getOpenrestyStatusVariant,
} from '@/features/nodes/utils';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。';
}

function formatTrendHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return `${date.getHours().toString().padStart(2, '0')}:00`;
}

function getAlertVariant(
  alert: DashboardAlert,
): 'success' | 'warning' | 'danger' | 'info' {
  if (alert.status === 'resolved') {
    return 'success';
  }
  if (alert.severity === 'critical') {
    return 'danger';
  }
  if (alert.severity === 'warning') {
    return 'warning';
  }
  return 'info';
}

function OverviewMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-5 py-5">
      <p className="text-xs tracking-[0.24em] text-[var(--foreground-muted)] uppercase">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-[var(--foreground-primary)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function NodeHealthRow({ node }: { node: DashboardNodeHealth }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground-primary)]">
            {node.name}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {node.node_id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={getNodeStatusLabel(node.status)}
            variant={getNodeStatusVariant(node.status)}
          />
          <StatusBadge
            label={getOpenrestyStatusLabel(node.openresty_status)}
            variant={getOpenrestyStatusVariant(node.openresty_status)}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
            CPU
          </p>
          <p className="mt-2 text-sm text-[var(--foreground-primary)]">
            {formatPercent(node.cpu_usage_percent)}
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
            内存
          </p>
          <p className="mt-2 text-sm text-[var(--foreground-primary)]">
            {formatPercent(node.memory_usage_percent)}
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
            最近窗口请求
          </p>
          <p className="mt-2 text-sm text-[var(--foreground-primary)]">
            {node.request_count}
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
            活动异常
          </p>
          <p className="mt-2 text-sm text-[var(--foreground-primary)]">
            {node.active_event_count}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--foreground-secondary)]">
        <p>当前版本：{node.current_version || '未应用'}</p>
        <p>
          最近心跳：
          {node.last_seen_at
            ? ` ${formatRelativeTime(node.last_seen_at)} · ${formatDateTime(node.last_seen_at)}`
            : ' 暂无'}
        </p>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    refetchInterval: 10000,
  });

  if (overviewQuery.isLoading) {
    return <LoadingState />;
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        title="总览看板加载失败"
        description={getErrorMessage(overviewQuery.error)}
      />
    );
  }

  const overview = overviewQuery.data;
  if (!overview) {
    return (
      <EmptyState
        title="暂无总览数据"
        description="系统已经启动，但还没有可展示的总览聚合结果。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <AppCard
        title="系统运行总览"
        description="优先回答当前系统是否健康、容量是否紧张、是否存在配置落后和异常节点。"
        action={
          <div className="text-right text-sm text-[var(--foreground-secondary)]">
            生成时间：{formatDateTime(overview.generated_at)}
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-5">
          <OverviewMetric
            label="在线节点"
            value={`${overview.summary.online_nodes}/${overview.summary.total_nodes}`}
            hint={`${overview.summary.offline_nodes} 离线 · ${overview.summary.pending_nodes} 待接入`}
          />
          <OverviewMetric
            label="活动异常"
            value={overview.summary.active_alerts}
            hint={`${overview.summary.unhealthy_nodes} 个 OpenResty 不健康`}
          />
          <OverviewMetric
            label="配置落后"
            value={overview.summary.lagging_nodes}
            hint={overview.config.active_version || '当前无激活版本'}
          />
          <OverviewMetric
            label="最近窗口请求"
            value={overview.traffic.request_count}
            hint={`QPS ${overview.traffic.estimated_qps.toFixed(1)} · UV ${overview.traffic.unique_visitors}`}
          />
          <OverviewMetric
            label="平均 CPU"
            value={formatPercent(overview.capacity.average_cpu_usage_percent)}
            hint={`${overview.capacity.high_cpu_nodes} 个高 CPU 节点`}
          />
        </div>
      </AppCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AppCard
          title="24 小时请求趋势"
          description="观察整体请求量和错误量是否出现异常抬升。"
        >
          <TrendChart
            labels={overview.trends.traffic_24h.map((point) =>
              formatTrendHour(point.bucket_started_at),
            )}
            series={[
              {
                label: '请求量',
                color: '#f59e0b',
                fillColor: 'rgba(245, 158, 11, 0.18)',
                variant: 'area',
                values: overview.trends.traffic_24h.map(
                  (point) => point.request_count,
                ),
              },
              {
                label: '错误量',
                color: '#ef4444',
                values: overview.trends.traffic_24h.map(
                  (point) => point.error_count,
                ),
              },
            ]}
          />
        </AppCard>

        <AppCard
          title="24 小时容量趋势"
          description="按小时聚合 CPU 与内存使用率，判断整体容量是否持续紧张。"
        >
          <TrendChart
            labels={overview.trends.capacity_24h.map((point) =>
              formatTrendHour(point.bucket_started_at),
            )}
            series={[
              {
                label: '平均 CPU',
                color: '#0f766e',
                fillColor: 'rgba(15, 118, 110, 0.15)',
                variant: 'area',
                values: overview.trends.capacity_24h.map(
                  (point) => point.average_cpu_usage_percent,
                ),
                valueFormatter: formatPercent,
              },
              {
                label: '平均内存',
                color: '#2563eb',
                values: overview.trends.capacity_24h.map(
                  (point) => point.average_memory_usage_percent,
                ),
                valueFormatter: formatPercent,
              },
            ]}
          />
        </AppCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AppCard
          title="节点健康列表"
          description="按异常数量和资源压力排序，优先显示最需要关注的节点。"
          action={
            <Link
              href="/node"
              className="inline-flex items-center rounded-full border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--foreground-primary)] transition hover:bg-[var(--control-background-hover)]"
            >
              进入节点页
            </Link>
          }
        >
          {overview.nodes.length === 0 ? (
            <EmptyState
              title="暂无节点"
              description="节点接入后，这里会展示系统健康与容量摘要。"
            />
          ) : (
            <div className="space-y-4">
              {overview.nodes.slice(0, 8).map((node) => (
                <NodeHealthRow key={node.node_id} node={node} />
              ))}
            </div>
          )}
        </AppCard>

        <div className="space-y-6">
          <AppCard
            title="流量与容量"
            description="聚合最近窗口流量和资源压力，作为首页一级信号。"
          >
            <div className="grid gap-4">
              <OverviewMetric
                label="最近窗口错误"
                value={overview.traffic.error_count}
                hint={`${overview.traffic.reported_nodes} 个节点上报`}
              />
              <OverviewMetric
                label="平均内存"
                value={formatPercent(
                  overview.capacity.average_memory_usage_percent,
                )}
                hint={`${overview.capacity.high_memory_nodes} 个高内存节点`}
              />
              <OverviewMetric
                label="高存储压力"
                value={overview.capacity.high_storage_nodes}
                hint="存储使用率 >= 85%"
              />
            </div>
          </AppCard>

          <AppCard
            title="活动异常"
            description="优先展示当前仍在触发中的问题。"
          >
            {overview.active_alerts.length === 0 ? (
              <EmptyState
                title="暂无活动异常"
                description="当前系统没有正在触发的节点健康事件。"
              />
            ) : (
              <div className="space-y-3">
                {overview.active_alerts.map((alert) => (
                  <div
                    key={`${alert.node_id}-${alert.event_type}-${alert.last_triggered_at}`}
                    className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={alert.event_type.replaceAll('_', ' ')}
                        variant={getAlertVariant(alert)}
                      />
                      <p className="text-sm font-medium text-[var(--foreground-primary)]">
                        {alert.node_name}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                      {alert.message || '暂无详细消息'}
                    </p>
                    <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                      {formatRelativeTime(alert.last_triggered_at)} ·{' '}
                      {formatDateTime(alert.last_triggered_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </div>
  );
}
