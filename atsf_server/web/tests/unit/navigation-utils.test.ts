import { describe, expect, it } from 'vitest';

import { getCurrentNavigationItem, isPathActive } from '@/lib/utils/navigation';

describe('navigation utils', () => {
  it('marks root path as active only for home', () => {
    expect(isPathActive('/', '/')).toBe(true);
    expect(isPathActive('/node', '/')).toBe(false);
  });

  it('resolves current navigation item for nested paths', () => {
    expect(getCurrentNavigationItem('/node/abc')?.label).toBe('节点');
    expect(getCurrentNavigationItem('/managed-domain')?.label).toBe('域名');
    expect(getCurrentNavigationItem('/setting')?.label).toBe('设置');
  });
});
