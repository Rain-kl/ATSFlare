export interface ApplyLogItem {
  id: number;
  node_id: string;
  version: string;
  result: 'success' | 'failed' | string;
  message: string;
  created_at: string;
}
