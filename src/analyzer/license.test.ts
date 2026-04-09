import {
  classifyLicenseRisk,
  extractLicense,
  analyzeLicenses,
  formatLicenseReport,
} from './license';
import { DependencyChange } from '../diff/compare';

describe('classifyLicenseRisk', () => {
  it('returns low for MIT', () => {
    expect(classifyLicenseRisk('MIT')).toBe('low');
  });

  it('returns low for Apache-2.0', () => {
    expect(classifyLicenseRisk('Apache-2.0')).toBe('low');
  });

  it('returns high for GPL-3.0', () => {
    expect(classifyLicenseRisk('GPL-3.0')).toBe('high');
  });

  it('returns high for AGPL-3.0', () => {
    expect(classifyLicenseRisk('AGPL-3.0')).toBe('high');
  });

  it('returns medium for unknown proprietary license', () => {
    expect(classifyLicenseRisk('Proprietary')).toBe('medium');
  });

  it('returns unknown for null', () => {
    expect(classifyLicenseRisk(null)).toBe('unknown');
  });
});

describe('extractLicense', () => {
  it('extracts license string from meta', () => {
    expect(extractLicense({ license: 'MIT' })).toBe('MIT');
  });

  it('returns null when no license field', () => {
    expect(extractLicense({ version: '1.0.0' })).toBeNull();
  });

  it('returns null for undefined meta', () => {
    expect(extractLicense(undefined)).toBeNull();
  });
});

describe('analyzeLicenses', () => {
  const changes: DependencyChange[] = [
    { name: 'lodash', type: 'added', from: null, to: '4.17.21' },
    { name: 'evil-pkg', type: 'changed', from: '1.0.0', to: '2.0.0' },
    { name: 'removed-pkg', type: 'removed', from: '1.0.0', to: null },
  ];

  const metaMap = {
    lodash: { license: 'MIT' },
    'evil-pkg': { license: 'GPL-3.0' },
  };

  it('only includes added and changed entries', () => {
    const report = analyzeLicenses(changes, metaMap);
    expect(report.entries).toHaveLength(2);
    expect(report.entries.map(e => e.name)).toEqual(['lodash', 'evil-pkg']);
  });

  it('counts risks correctly', () => {
    const report = analyzeLicenses(changes, metaMap);
    expect(report.riskCounts.low).toBe(1);
    expect(report.riskCounts.high).toBe(1);
  });

  it('flags hasHighRisk when GPL present', () => {
    const report = analyzeLicenses(changes, metaMap);
    expect(report.hasHighRisk).toBe(true);
  });

  it('returns unknown for packages missing from metaMap', () => {
    const report = analyzeLicenses(changes, {});
    expect(report.riskCounts.unknown).toBe(2);
  });
});

describe('formatLicenseReport', () => {
  it('returns no-dependencies message for empty report', () => {
    const report = analyzeLicenses([], {});
    const output = formatLicenseReport(report);
    expect(output).toContain('No new or changed dependencies');
  });

  it('includes risk summary line', () => {
    const changes: DependencyChange[] = [
      { name: 'react', type: 'added', from: null, to: '18.0.0' },
    ];
    const report = analyzeLicenses(changes, { react: { license: 'MIT' } });
    const output = formatLicenseReport(report);
    expect(output).toContain('Risk summary');
    expect(output).toContain('[LOW]');
  });
});
