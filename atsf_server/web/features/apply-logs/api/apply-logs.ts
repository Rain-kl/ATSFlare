import { apiRequest } from '@/lib/api/client';

import type { ApplyLogItem } from '@/features/apply-logs/types';

export function getApplyLogs(nodeId?: string) {
  const normalizedNodeId = nodeId?.trim();
  const query = normalizedNodeId ? `?node_id=${encodeURIComponent(normalizedNodeId)}` : '';
  return apiRequest<ApplyLogItem[]>(`/apply-logs/${query}`);
}
