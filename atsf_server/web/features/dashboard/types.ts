export interface DashboardSummary {
  total_nodes: number;
  online_nodes: number;
  offline_nodes: number;
  pending_nodes: number;
  unhealthy_nodes: number;
  active_alerts: number;
  lagging_nodes: number;
}

export interface DashboardTraffic {
  request_count: number;
  unique_visitors: number;
  error_count: number;
  estimated_qps: number;
  reported_nodes: number;
}

export interface DashboardCapacity {
  average_cpu_usage_percent: number;
  average_memory_usage_percent: number;
  high_cpu_nodes: number;
  high_memory_nodes: number;
  high_storage_nodes: number;
}

export interface DashboardConfig {
  active_version: string;
  lagging_nodes: number;
  pending_nodes: number;
}

export interface TrafficTrendPoint {
  bucket_started_at: string;
  request_count: number;
  error_count: number;
  unique_visitor_count: number;
}

export interface CapacityTrendPoint {
  bucket_started_at: string;
  average_cpu_usage_percent: number;
  average_memory_usage_percent: number;
  reported_nodes: number;
}

export interface DashboardTrends {
  traffic_24h: TrafficTrendPoint[];
  capacity_24h: CapacityTrendPoint[];
}

export interface DashboardNodeHealth {
  id: number;
  node_id: string;
  name: string;
  status: 'online' | 'offline' | 'pending';
  openresty_status: 'healthy' | 'unhealthy' | 'unknown';
  current_version: string;
  last_seen_at: string;
  active_event_count: number;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  storage_usage_percent: number;
  request_count: number;
  error_count: number;
  unique_visitor_count: number;
}

export interface DashboardAlert {
  node_id: string;
  node_name: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  last_triggered_at: string;
  status: 'active' | 'resolved';
}

export interface DashboardOverview {
  generated_at: string;
  summary: DashboardSummary;
  traffic: DashboardTraffic;
  capacity: DashboardCapacity;
  config: DashboardConfig;
  trends: DashboardTrends;
  nodes: DashboardNodeHealth[];
  active_alerts: DashboardAlert[];
}
