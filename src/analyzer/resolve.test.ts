import {
  detectResolutionConflicts,
  classifyConflictLevel,
  analyzeResolutions,
  formatResolutionReport,
} from './resolve';

describe('classifyConflictLevel', () => {
  it('returns major when major versions differ', () => {
    expect(classifyConflictLevel(['1.0.0', '2.0.0'])).toBe('major');
  });

  it('returns minor when minor versions differ', () => {
    expect(classifyConflictLevel(['1.1.0', '1.2.0'])).toBe('minor');
  });

  it('returns patch when only patch versions differ', () => {
    expect(classifyConflictLevel(['1.0.1', '1.0.2'])).toBe('patch');
  });
});

describe('detectResolutionConflicts', () => {
  it('returns empty array when no conflicts', () => {
    const result = detectResolutionConflicts({ lodash: ['4.17.21'] });
    expect(result).toHaveLength(0);
  });

  it('detects a conflict with multiple versions', () => {
    const result = detectResolutionConflicts({
      react: ['17.0.0', '18.0.0'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('react');
    expect(result[0].conflictLevel).toBe('major');
    expect(result[0].requestedVersions).toContain('17.0.0');
    expect(result[0].requestedVersions).toContain('18.0.0');
  });

  it('deduplicates identical versions', () => {
    const result = detectResolutionConflicts({
      lodash: ['4.17.21', '4.17.21'],
    });
    expect(result).toHaveLength(0);
  });
});

describe('analyzeResolutions', () => {
  it('returns totals and empty conflicts for clean deps', () => {
    const report = analyzeResolutions(
      { lodash: '4.17.21', chalk: '5.0.0' },
      {}
    );
    expect(report.total).toBe(2);
    expect(report.conflicts).toHaveLength(0);
    expect(report.overrides).toHaveLength(0);
  });

  it('includes overrides from resolutions map', () => {
    const report = analyzeResolutions(
      { lodash: '4.17.21' },
      { lodash: '4.17.15' }
    );
    expect(report.overrides).toHaveLength(1);
    expect(report.overrides[0].resolvedVersion).toBe('4.17.15');
    expect(report.overrides[0].isOverride).toBe(true);
  });
});

describe('formatResolutionReport', () => {
  it('shows no conflicts message when clean', () => {
    const report = analyzeResolutions({ lodash: '4.17.21' }, {});
    const output = formatResolutionReport(report);
    expect(output).toContain('No version conflicts detected');
    expect(output).toContain('Resolution Analysis (1 packages)');
  });

  it('shows conflict details when present', () => {
    const report = {
      total: 1,
      overrides: [],
      conflicts: [
        {
          name: 'react',
          requestedVersions: ['17.0.0', '18.0.0'],
          resolvedVersion: '18.0.0',
          conflictLevel: 'major' as const,
        },
      ],
    };
    const output = formatResolutionReport(report);
    expect(output).toContain('[MAJOR]');
    expect(output).toContain('react');
    expect(output).toContain('17.0.0, 18.0.0');
  });
});
