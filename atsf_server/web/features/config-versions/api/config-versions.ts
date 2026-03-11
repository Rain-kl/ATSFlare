import { apiRequest } from '@/lib/api/client';

import type {
  ConfigDiffResult,
  ConfigPreviewResult,
  ConfigVersionItem,
} from '@/features/config-versions/types';

export function getConfigVersions() {
  return apiRequest<ConfigVersionItem[]>('/config-versions/');
}

export function getConfigVersionPreview() {
  return apiRequest<ConfigPreviewResult>('/config-versions/preview');
}

export function getConfigVersionDiff() {
  return apiRequest<ConfigDiffResult>('/config-versions/diff');
}

export function publishConfigVersion() {
  return apiRequest<ConfigVersionItem>('/config-versions/publish', {
    method: 'POST',
  });
}

export function activateConfigVersion(id: number) {
  return apiRequest<ConfigVersionItem>(`/config-versions/${id}/activate`, {
    method: 'PUT',
  });
}
