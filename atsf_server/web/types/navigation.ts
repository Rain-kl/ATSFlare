export type NavigationIconKey =
  | 'home'
  | 'node'
  | 'website'
  | 'domain'
  | 'certificate'
  | 'proxy'
  | 'release'
  | 'user'
  | 'setting';

export interface NavigationItem {
  href: string;
  label: string;
  icon: NavigationIconKey;
  children?: NavigationItem[];
}
