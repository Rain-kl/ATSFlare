import { apiRequest } from '@/lib/api/client';

import type {
  TlsCertificateContentItem,
  TlsCertificateDetailItem,
  TlsCertificateFileImportPayload,
  TlsCertificateItem,
  TlsCertificateMutationPayload,
} from '@/features/tls-certificates/types';

export function getTlsCertificates() {
  return apiRequest<TlsCertificateItem[]>('/tls-certificates/');
}

export function createTlsCertificate(payload: TlsCertificateMutationPayload) {
  return apiRequest<TlsCertificateItem>('/tls-certificates/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTlsCertificate(id: number) {
  return apiRequest<TlsCertificateDetailItem>(`/tls-certificates/${id}`);
}

export function getTlsCertificateContent(id: number) {
  return apiRequest<TlsCertificateContentItem>(`/tls-certificates/${id}/content`);
}

export function updateTlsCertificate(
  id: number,
  payload: TlsCertificateMutationPayload,
) {
  return apiRequest<TlsCertificateItem>(`/tls-certificates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function importTlsCertificateFiles(payload: TlsCertificateFileImportPayload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('remark', payload.remark);
  formData.append('cert_file', payload.certFile);
  formData.append('key_file', payload.keyFile);

  return apiRequest<TlsCertificateItem>('/tls-certificates/import-file', {
    method: 'POST',
    body: formData,
  });
}

export function deleteTlsCertificate(id: number) {
  return apiRequest<void>(`/tls-certificates/${id}`, {
    method: 'DELETE',
  });
}
