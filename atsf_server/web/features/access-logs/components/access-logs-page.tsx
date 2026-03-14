'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { PageHeader } from '@/components/layout/page-header';
import { AppCard } from '@/components/ui/app-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAccessLogs } from '@/features/access-logs/api/access-logs';
import type { AccessLogItem } from '@/features/access-logs/types';
import {
  PrimaryButton,
  ResourceInput,
  SecondaryButton,
} from '@/features/shared/components/resource-primitives';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/date';

const accessLogsQueryKey = (nodeId: string) => ['access-logs', nodeId] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。';
}

function buildSummary(logs: AccessLogItem[]) {
  const uniqueIPs = new Set(logs.map((item) => item.remote_addr).filter(Boolean));
  const uniqueNodes = new Set(logs.map((item) => item.node_id).filter(Boolean));

  return [
    { label: '访问记录', value: logs.length },
    { label: '来源 IP', value: uniqueIPs.size },
    { label: '命中节点', value: uniqueNodes.size },
    {
      label: '5xx 响应',
      value: logs.filter((item) => item.status_code >= 500).length,
    },
  ];
}

function getStatusMeta(statusCode: number) {
  if (statusCode >= 500) {
    return { label: String(statusCode), variant: 'danger' as const };
  }
  if (statusCode >= 400) {
    return { label: String(statusCode), variant: 'warning' as const };
  }
  return { label: String(statusCode), variant: 'success' as const };
}

export function AccessLogsPage() {
  const queryClient = useQueryClient();
  const [nodeFilterInput, setNodeFilterInput] = useState('');
  const [nodeFilter, setNodeFilter] = useState('');

  const logsQuery = useQuery({
    queryKey: accessLogsQueryKey(nodeFilter),
    queryFn: () => getAccessLogs(nodeFilter),
  });

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const summary = useMemo(() => buildSummary(logs), [logs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="日志"
        description="查看最近时间窗口内的访问记录，包含来源 IP、访问域名、路径、命中节点与响应状态码。"
        action={
          <Link
            href="/node"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--control-background)] px-4 py-3 text-sm font-medium text-[var(--foreground-primary)] transition hover:bg-[var(--control-background-hover)]"
          >
            返回节点页
          </Link>
        }
      />

      <AppCard
        title="日志摘要"
        description="帮助快速了解最近访问量、来源范围和异常响应规模。"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-4"
            >
              <p className="text-xs tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground-primary)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </AppCard>

      <AppCard
        title="访问记录"
        description="默认展示全部节点的最近访问日志，可按 node_id 快速过滤。"
        action={
          <SecondaryButton
            type="button"
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: accessLogsQueryKey(nodeFilter),
              })
            }
          >
            刷新
          </SecondaryButton>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <ResourceInput
              value={nodeFilterInput}
              onChange={(event) => setNodeFilterInput(event.target.value)}
              placeholder="输入 node_id 过滤访问日志"
              className="lg:max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              <PrimaryButton
                type="button"
                onClick={() => setNodeFilter(nodeFilterInput.trim())}
              >
                筛选
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setNodeFilter('');
                  setNodeFilterInput('');
                }}
              >
                清空
              </SecondaryButton>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <LoadingState />
          ) : logsQuery.isError ? (
            <ErrorState
              title="访问日志加载失败"
              description={getErrorMessage(logsQuery.error)}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              title="暂无访问日志"
              description="当前时间窗口内还没有可展示的访问记录。"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-default)] text-left text-sm">
                <thead>
                  <tr className="text-[var(--foreground-secondary)]">
                    <th className="px-3 py-3 font-medium">时间</th>
                    <th className="px-3 py-3 font-medium">原 IP</th>
                    <th className="px-3 py-3 font-medium">访问域名</th>
                    <th className="px-3 py-3 font-medium">路径</th>
                    <th className="px-3 py-3 font-medium">节点</th>
                    <th className="px-3 py-3 font-medium">状态码</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {logs.map((item) => {
                    const statusMeta = getStatusMeta(item.status_code);
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                          <div>{formatDateTime(item.logged_at)}</div>
                          <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {formatRelativeTime(item.logged_at)}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-medium text-[var(--foreground-primary)]">
                          {item.remote_addr || '—'}
                        </td>
                        <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                          {item.host || '—'}
                        </td>
                        <td
                          className="max-w-[360px] px-3 py-4 text-[var(--foreground-secondary)]"
                          title={item.path}
                        >
                          <span className="break-all">{item.path || '—'}</span>
                        </td>
                        <td className="px-3 py-4 text-[var(--foreground-secondary)]">
                          <div>{item.node_name || item.node_id}</div>
                          <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {item.node_id}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge
                            label={statusMeta.label}
                            variant={statusMeta.variant}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppCard>
    </div>
  );
}
