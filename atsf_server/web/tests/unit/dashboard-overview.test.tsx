import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

describe('DashboardOverview', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders dashboard summary cards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/dashboard/overview')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                message: '',
                data: {
                  generated_at: '2026-03-14T08:00:00Z',
                  summary: {
                    total_nodes: 2,
                    online_nodes: 2,
                    offline_nodes: 0,
                    pending_nodes: 0,
                    unhealthy_nodes: 1,
                    active_alerts: 1,
                    lagging_nodes: 1,
                  },
                  traffic: {
                    request_count: 900,
                    unique_visitors: 200,
                    error_count: 36,
                    estimated_qps: 15,
                    reported_nodes: 2,
                  },
                  capacity: {
                    average_cpu_usage_percent: 68.5,
                    average_memory_usage_percent: 71.8,
                    high_cpu_nodes: 1,
                    high_memory_nodes: 1,
                    high_storage_nodes: 1,
                  },
                  config: {
                    active_version: '20260314-001',
                    lagging_nodes: 1,
                    pending_nodes: 0,
                  },
                  trends: {
                    traffic_24h: Array.from({ length: 24 }, (_, index) => ({
                      bucket_started_at: `2026-03-13T${String(index).padStart(2, '0')}:00:00Z`,
                      request_count: index * 10,
                      error_count: index,
                      unique_visitor_count: index * 3,
                    })),
                    capacity_24h: Array.from({ length: 24 }, (_, index) => ({
                      bucket_started_at: `2026-03-13T${String(index).padStart(2, '0')}:00:00Z`,
                      average_cpu_usage_percent: index,
                      average_memory_usage_percent: index + 10,
                      reported_nodes: 2,
                    })),
                  },
                  nodes: [
                    {
                      id: 1,
                      node_id: 'node-a',
                      name: 'edge-a',
                      status: 'online',
                      openresty_status: 'healthy',
                      current_version: '20260314-001',
                      last_seen_at: '2026-03-14T08:00:00Z',
                      active_event_count: 0,
                      cpu_usage_percent: 45,
                      memory_usage_percent: 50,
                      storage_usage_percent: 60,
                      request_count: 600,
                      error_count: 6,
                      unique_visitor_count: 120,
                    },
                  ],
                  active_alerts: [
                    {
                      node_id: 'node-b',
                      node_name: 'edge-b',
                      event_type: 'openresty_unhealthy',
                      severity: 'critical',
                      message: 'reload failed',
                      last_triggered_at: '2026-03-14T07:59:00Z',
                      status: 'active',
                    },
                  ],
                },
              }),
            ),
          );
        }

        return Promise.reject(new Error(`Unhandled fetch: ${url}`));
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardOverview />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('系统运行总览')).toBeInTheDocument();
    expect(await screen.findByText('24 小时请求趋势')).toBeInTheDocument();
    expect(await screen.findByText('节点健康列表')).toBeInTheDocument();
  });
});
