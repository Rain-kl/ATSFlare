export interface NodeItem {
	id: number;
	node_id: string;
	name: string;
	ip: string;
	agent_token: string;
	auto_update_enabled: boolean;
	update_requested: boolean;
	agent_version: string;
	nginx_version: string;
	status: 'online' | 'offline' | 'pending';
	current_version: string;
	last_seen_at: string;
	last_error: string;
	latest_apply_result: 'success' | 'failed' | '';
	latest_apply_message: string;
	latest_apply_at?: string | null;
	created_at: string;
	updated_at: string;
}

export interface NodeBootstrapToken {
	discovery_token: string;
}

export interface NodeMutationPayload {
	name: string;
	auto_update_enabled: boolean;
}
