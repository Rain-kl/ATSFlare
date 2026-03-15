import type { AuthUser } from '@/types/auth';

export interface OptionItem {
  key: string;
  value: string;
}

export interface BootstrapTokenPayload {
  discovery_token: string;
}

export interface GeoIPLookupResult {
  provider: string;
  ip: string;
  iso_code: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateSelfPayload {
  username: string;
  display_name: string;
  password: string;
}

export type SettingsProfile = AuthUser;
