export interface AccessLogItem {
  id: number;
  node_id: string;
  node_name: string;
  logged_at: string;
  remote_addr: string;
  host: string;
  path: string;
  status_code: number;
}
