import {
  detectSource,
  isPrivatePackage,
  analyzePrivate,
  formatPrivateReport,
} from './private';

describe('detectSource', () => {
  it('returns npm for registry.npmjs.org URLs', () => {
    expect(detectSource('lodash', 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz')).toBe('npm');
  });

  it('returns github for github.com URLs', () => {
    expect(detectSource('my-pkg', 'https://github.com/org/my-pkg/archive/main.tar.gz')).toBe('github');
  });

  it('returns gitlab for gitlab.com URLs', () => {
    expect(detectSource('my-pkg', 'https://gitlab.com/org/my-pkg')).toBe('gitlab');
  });

  it('returns local for file: protocol', () => {
    expect(detectSource('local-pkg', 'file:../local-pkg')).toBe('local');
  });

  it('returns unknown when resolved is undefined', () => {
    expect(detectSource('some-pkg', undefined)).toBe('unknown');
  });
});

describe('isPrivatePackage', () => {
  it('returns false for public npm packages', () => {
    expect(
      isPrivatePackage('react', 'https://registry.npmjs.org/react/-/react-18.0.0.tgz')
    ).toBe(false);
  });

  it('returns true for github-sourced packages', () => {
    expect(
      isPrivatePackage('my-lib', 'https://github.com/org/my-lib/archive/v1.0.0.tar.gz')
    ).toBe(true);
  });

  it('returns true for local packages', () => {
    expect(isPrivatePackage('local-utils', 'file:./packages/local-utils')).toBe(true);
  });
});

describe('analyzePrivate', () => {
  const deps = {
    react: { version: '18.0.0', resolved: 'https://registry.npmjs.org/react/-/react-18.0.0.tgz' },
    'my-internal': { version: '1.0.0', resolved: 'https://github.com/org/my-internal/archive/v1.0.0.tar.gz' },
    'local-pkg': { version: '0.1.0', resolved: 'file:../local-pkg' },
  };

  it('counts total, private, and public correctly', () => {
    const result = analyzePrivate(deps);
    expect(result.total).toBe(3);
    expect(result.privateCount).toBe(2);
    expect(result.publicCount).toBe(1);
  });

  it('marks github packages as private', () => {
    const result = analyzePrivate(deps);
    const pkg = result.packages.find((p) => p.name === 'my-internal');
    expect(pkg?.isPrivate).toBe(true);
    expect(pkg?.source).toBe('github');
  });
});

describe('formatPrivateReport', () => {
  it('includes summary line', () => {
    const result = analyzePrivate({
      react: { version: '18.0.0', resolved: 'https://registry.npmjs.org/react/-/react-18.0.0.tgz' },
    });
    const report = formatPrivateReport(result);
    expect(report).toContain('Private/Non-Public Packages: 0 of 1');
    expect(report).toContain('No private or non-public packages detected.');
  });

  it('lists private packages with source', () => {
    const result = analyzePrivate({
      'my-lib': { version: '2.0.0', resolved: 'https://github.com/org/my-lib/archive/v2.0.0.tar.gz' },
    });
    const report = formatPrivateReport(result);
    expect(report).toContain('my-lib@2.0.0');
    expect(report).toContain('[source: github]');
  });
});
