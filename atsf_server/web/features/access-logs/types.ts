export interface AccessLogItem {
  id: number;
  node_id: string;
  node_name: string;
  logged_at: string;
  remote_addr: string;
  region: string;
  host: string;
  path: string;
  status_code: number;
}

export interface AccessLogList {
  items: AccessLogItem[];
  page: number;
  page_size: number;
  has_more: boolean;
  total_record: number;
  total_ip: number;
}
