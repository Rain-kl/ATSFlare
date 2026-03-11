export interface ConfigVersionItem {
  id: number;
  version: string;
  snapshot_json: string;
  rendered_config: string;
  support_files_json: string;
  checksum: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface SupportFile {
  path: string;
  content: string;
}

export interface ConfigPreviewResult {
  snapshot_json: string;
  rendered_config: string;
  support_files: SupportFile[];
  checksum: string;
  route_count: number;
}

export interface ConfigDiffResult {
  active_version?: string;
  added_domains: string[];
  removed_domains: string[];
  modified_domains: string[];
}
