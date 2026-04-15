import {
  detectVisibility,
  extractScope,
  analyzeVisibility,
  formatVisibilityReport,
} from './visibility';

describe('detectVisibility', () => {
  it('returns public for npmjs.org resolved URLs', () => {
    expect(
      detectVisibility('lodash', '4.17.21', 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz')
    ).toBe('public');
  });

  it('returns restricted for GitHub Packages', () => {
    expect(
      detectVisibility('@myorg/pkg', '1.0.0', 'https://npm.pkg.github.com/@myorg/pkg/-/pkg-1.0.0.tgz')
    ).toBe('restricted');
  });

  it('returns private for file: protocol', () => {
    expect(detectVisibility('local-pkg', '0.1.0', 'file:../local-pkg')).toBe('private');
  });

  it('returns private for git+ protocol', () => {
    expect(detectVisibility('git-pkg', '1.0.0', 'git+https://github.com/org/repo.git')).toBe('private');
  });

  it('returns unknown when resolved is undefined', () => {
    expect(detectVisibility('unknown-pkg', '1.0.0', undefined)).toBe('unknown');
  });

  it('returns restricted for artifactory registries', () => {
    expect(
      detectVisibility('corp-pkg', '2.0.0', 'https://artifactory.corp.com/npm/corp-pkg-2.0.0.tgz')
    ).toBe('restricted');
  });
});

describe('extractScope', () => {
  it('extracts scope from scoped package names', () => {
    expect(extractScope('@myorg/utils')).toBe('@myorg');
  });

  it('returns undefined for unscoped packages', () => {
    expect(extractScope('lodash')).toBeUndefined();
  });
});

describe('analyzeVisibility', () => {
  const packages = {
    lodash: { version: '4.17.21', resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz' },
    'local-lib': { version: '0.1.0', resolved: 'file:../local-lib' },
    '@corp/sdk': { version: '3.0.0', resolved: 'https://artifactory.corp.com/npm/@corp/sdk-3.0.0.tgz' },
    mystery: { version: '1.0.0' },
  };

  it('produces correct summary counts', () => {
    const report = analyzeVisibility(packages);
    expect(report.summary.public).toBe(1);
    expect(report.summary.private).toBe(1);
    expect(report.summary.restricted).toBe(1);
    expect(report.summary.unknown).toBe(1);
  });

  it('creates an entry for each package', () => {
    const report = analyzeVisibility(packages);
    expect(report.entries).toHaveLength(4);
  });

  it('attaches scope to scoped packages', () => {
    const report = analyzeVisibility(packages);
    const corpEntry = report.entries.find((e) => e.name === '@corp/sdk');
    expect(corpEntry?.scope).toBe('@corp');
  });
});

describe('formatVisibilityReport', () => {
  it('includes summary line', () => {
    const report = analyzeVisibility({
      lodash: { version: '4.0.0', resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.0.0.tgz' },
    });
    const output = formatVisibilityReport(report);
    expect(output).toContain('Public: 1');
  });

  it('lists non-public packages', () => {
    const report = analyzeVisibility({
      'local-pkg': { version: '1.0.0', resolved: 'file:../local-pkg' },
    });
    const output = formatVisibilityReport(report);
    expect(output).toContain('[PRIVATE]');
    expect(output).toContain('local-pkg@1.0.0');
  });
});
