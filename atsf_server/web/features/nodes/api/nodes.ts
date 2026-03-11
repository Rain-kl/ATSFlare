import { apiRequest } from '@/lib/api/client';

import type {
	NodeBootstrapToken,
	NodeItem,
	NodeMutationPayload,
} from '@/features/nodes/types';

export function getNodes() {
	return apiRequest<NodeItem[]>('/nodes/');
}

export function createNode(payload: NodeMutationPayload) {
	return apiRequest<NodeItem>('/nodes/', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function updateNode(id: number, payload: NodeMutationPayload) {
	return apiRequest<NodeItem>(`/nodes/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	});
}

export function deleteNode(id: number) {
	return apiRequest<void>(`/nodes/${id}`, {
		method: 'DELETE',
	});
}

export function getNodeBootstrapToken() {
	return apiRequest<NodeBootstrapToken>('/nodes/bootstrap-token');
}

export function rotateNodeBootstrapToken() {
	return apiRequest<NodeBootstrapToken>('/nodes/bootstrap-token/rotate', {
		method: 'POST',
	});
}

export function requestNodeAgentUpdate(id: number) {
	return apiRequest<NodeItem>(`/nodes/${id}/agent-update`, {
		method: 'POST',
	});
}
