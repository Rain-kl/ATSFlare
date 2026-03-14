import type { ReleaseChannel } from '@/features/update/types';

export interface NodeItem {
  id: number;
  node_id: string;
  name: string;
  ip: string;
  agent_token: string;
  auto_update_enabled: boolean;
  update_requested: boolean;
  update_channel: ReleaseChannel;
  update_tag: string;
  restart_openresty_requested: boolean;
  agent_version: string;
  nginx_version: string;
  openresty_status: 'healthy' | 'unhealthy' | 'unknown';
  openresty_message: string;
  status: 'online' | 'offline' | 'pending';
  current_version: string;
  last_seen_at: string;
  last_error: string;
  latest_apply_result: 'success' | 'failed' | '';
  latest_apply_message: string;
  latest_apply_checksum: string;
  latest_main_config_checksum: string;
  latest_route_config_checksum: string;
  latest_support_file_count: number;
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

export interface NodeAgentReleaseInfo {
  tag_name: string;
  body: string;
  html_url: string;
  published_at: string;
  current_version: string;
  has_update: boolean;
  channel: ReleaseChannel;
  prerelease: boolean;
  update_requested: boolean;
  requested_channel: ReleaseChannel;
  requested_tag: string;
}

export interface NodeAgentUpdatePayload {
  channel?: ReleaseChannel;
  tag_name?: string;
}

export interface NodeSystemProfile {
  hostname: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  architecture: string;
  cpu_model: string;
  cpu_cores: number;
  total_memory_bytes: number;
  total_disk_bytes: number;
  uptime_seconds: number;
  reported_at: string;
}

export interface NodeMetricSnapshot {
  captured_at: string;
  cpu_usage_percent: number;
  memory_used_bytes: number;
  memory_total_bytes: number;
  storage_used_bytes: number;
  storage_total_bytes: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  openresty_rx_bytes: number;
  openresty_tx_bytes: number;
  openresty_connections: number;
}

export interface NodeTrafficReport {
  window_started_at: string;
  window_ended_at: string;
  request_count: number;
  error_count: number;
  unique_visitor_count: number;
  status_codes_json: string;
  top_domains_json: string;
  source_countries_json: string;
}

export interface NodeTrafficTrendPoint {
  bucket_started_at: string;
  request_count: number;
  error_count: number;
  unique_visitor_count: number;
}

export interface NodeCapacityTrendPoint {
  bucket_started_at: string;
  average_cpu_usage_percent: number;
  average_memory_usage_percent: number;
  reported_nodes: number;
}

export interface NodeObservabilityTrends {
  traffic_24h: NodeTrafficTrendPoint[];
  capacity_24h: NodeCapacityTrendPoint[];
}

export interface NodeHealthEvent {
  event_type: string;
  severity: string;
  status: string;
  message: string;
  first_triggered_at: string;
  last_triggered_at: string;
  reported_at: string;
  resolved_at?: string | null;
}

export interface NodeObservability {
  node_id: string;
  profile: NodeSystemProfile | null;
  metric_snapshots: NodeMetricSnapshot[];
  traffic_reports: NodeTrafficReport[];
  health_events: NodeHealthEvent[];
  trends: NodeObservabilityTrends;
}
