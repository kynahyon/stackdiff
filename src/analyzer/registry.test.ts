import {
  detectRegistry,
  extractScope,
  analyzeRegistry,
  formatRegistryReport,
} from './registry';

describe('detectRegistry', () => {
  it('returns npm for npmjs.org url', () => {
    expect(detectRegistry('lodash', 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz')).toBe('npm');
  });

  it('returns github for github package registry url', () => {
    expect(detectRegistry('@org/pkg', 'https://npm.pkg.github.com/@org/pkg-1.0.0.tgz')).toBe('github');
  });

  it('returns gitlab for gitlab url', () => {
    expect(detectRegistry('mypkg', 'https://gitlab.com/api/v4/packages/npm/mypkg-1.0.0.tgz')).toBe('gitlab');
  });

  it('returns custom for arbitrary https url', () => {
    expect(detectRegistry('internal', 'https://my.registry.internal/internal-1.0.0.tgz')).toBe('custom');
  });

  it('returns npm when no url provided', () => {
    expect(detectRegistry('react')).toBe('npm');
  });
});

describe('extractScope', () => {
  it('extracts scope from scoped package', () => {
    expect(extractScope('@babel/core')).toBe('@babel');
  });

  it('returns null for unscoped package', () => {
    expect(extractScope('lodash')).toBeNull();
  });
});

describe('analyzeRegistry', () => {
  const deps = [
    { name: 'lodash', version: '4.17.21', resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz' },
    { name: '@babel/core', version: '7.0.0', resolved: 'https://registry.npmjs.org/@babel/core-7.0.0.tgz' },
    { name: 'internal-pkg', version: '1.0.0', resolved: 'https://my.registry.corp/internal-pkg-1.0.0.tgz' },
  ];

  it('counts total entries', () => {
    const result = analyzeRegistry(deps);
    expect(result.entries).toHaveLength(3);
  });

  it('counts scoped packages', () => {
    const result = analyzeRegistry(deps);
    expect(result.scopedCount).toBe(1);
  });

  it('counts custom registry packages', () => {
    const result = analyzeRegistry(deps);
    expect(result.customRegistryCount).toBe(1);
  });

  it('groups by registry correctly', () => {
    const result = analyzeRegistry(deps);
    expect(result.byRegistry.npm).toHaveLength(2);
    expect(result.byRegistry.custom).toHaveLength(1);
  });
});

describe('formatRegistryReport', () => {
  it('includes summary counts', () => {
    const result = analyzeRegistry([
      { name: 'pkg', version: '1.0.0', resolved: 'https://registry.npmjs.org/pkg-1.0.0.tgz' },
    ]);
    const report = formatRegistryReport(result);
    expect(report).toContain('Total packages: 1');
    expect(report).toContain('npm: 1');
  });

  it('lists custom registry packages when present', () => {
    const result = analyzeRegistry([
      { name: 'priv', version: '2.0.0', resolved: 'https://private.registry.io/priv-2.0.0.tgz' },
    ]);
    const report = formatRegistryReport(result);
    expect(report).toContain('priv@2.0.0');
  });
});
