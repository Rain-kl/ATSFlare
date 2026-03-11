import { apiRequest } from '@/lib/api/client';

import type {
  ManagedDomainMatchResult,
  ProxyRouteItem,
  ProxyRouteMutationPayload,
  TlsCertificateItem,
} from '@/features/proxy-routes/types';

export function getProxyRoutes() {
  return apiRequest<ProxyRouteItem[]>('/proxy-routes/');
}

export function createProxyRoute(payload: ProxyRouteMutationPayload) {
  return apiRequest<ProxyRouteItem>('/proxy-routes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProxyRoute(id: number, payload: ProxyRouteMutationPayload) {
  return apiRequest<ProxyRouteItem>(`/proxy-routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteProxyRoute(id: number) {
  return apiRequest<void>(`/proxy-routes/${id}`, {
    method: 'DELETE',
  });
}

export function getTlsCertificates() {
  return apiRequest<TlsCertificateItem[]>('/tls-certificates/');
}

export function matchManagedDomainCertificate(domain: string) {
  const searchParams = new URLSearchParams({ domain });
  return apiRequest<ManagedDomainMatchResult>(`/managed-domains/match?${searchParams.toString()}`);
}
