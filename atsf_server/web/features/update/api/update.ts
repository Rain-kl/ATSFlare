import { apiRequest } from '@/lib/api/client';

import type {
  LatestReleaseInfo,
  ReleaseChannel,
  UploadedServerBinaryInfo,
} from '@/features/update/types';

export function getLatestRelease(channel: ReleaseChannel = 'stable') {
  return apiRequest<LatestReleaseInfo>(
    `/update/latest-release?channel=${channel}`,
  );
}

export function upgradeServer(channel: ReleaseChannel = 'stable') {
  return apiRequest<LatestReleaseInfo>('/update/upgrade', {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });
}

export function uploadServerBinary(binary: File) {
  const formData = new FormData();
  formData.append('binary', binary);

  return apiRequest<UploadedServerBinaryInfo>('/update/manual-upload', {
    method: 'POST',
    body: formData,
  });
}

export function confirmManualServerUpgrade(uploadToken: string) {
  return apiRequest<UploadedServerBinaryInfo>('/update/manual-upgrade', {
    method: 'POST',
    body: JSON.stringify({ upload_token: uploadToken }),
  });
}
