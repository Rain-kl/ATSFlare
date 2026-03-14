import { apiRequest } from '@/lib/api/client';

import type { AccessLogItem } from '@/features/access-logs/types';

export function getAccessLogs(nodeId?: string) {
  const normalizedNodeId = nodeId?.trim();
  const query = normalizedNodeId
    ? `?node_id=${encodeURIComponent(normalizedNodeId)}`
    : '';
  return apiRequest<AccessLogItem[]>(`/access-logs/${query}`);
}
