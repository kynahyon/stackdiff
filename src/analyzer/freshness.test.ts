import {
  classifyFreshness,
  daysSince,
  analyzeFreshness,
  formatFreshnessReport,
} from './freshness';

describe('classifyFreshness', () => {
  it('returns fresh for packages published within 180 days', () => {
    expect(classifyFreshness(0)).toBe('fresh');
    expect(classifyFreshness(90)).toBe('fresh');
    expect(classifyFreshness(180)).toBe('fresh');
  });

  it('returns aging for packages between 181 and 730 days', () => {
    expect(classifyFreshness(181)).toBe('aging');
    expect(classifyFreshness(500)).toBe('aging');
    expect(classifyFreshness(730)).toBe('aging');
  });

  it('returns stale for packages older than 730 days', () => {
    expect(classifyFreshness(731)).toBe('stale');
    expect(classifyFreshness(2000)).toBe('stale');
  });

  it('returns unknown when days is undefined', () => {
    expect(classifyFreshness(undefined)).toBe('unknown');
  });
});

describe('daysSince', () => {
  it('returns a non-negative number', () => {
    const recent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString();
    expect(daysSince(recent)).toBeGreaterThanOrEqual(9);
  });

  it('returns approximately correct days for known dates', () => {
    const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString();
    const result = daysSince(tenDaysAgo);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });
});

describe('analyzeFreshness', () => {
  const packages = [
    { name: 'react', version: '18.0.0', publishedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { name: 'lodash', version: '4.17.21', publishedAt: new Date(Date.now() - 86400000 * 400).toISOString() },
    { name: 'legacy-lib', version: '1.0.0', publishedAt: new Date(Date.now() - 86400000 * 900).toISOString() },
    { name: 'unknown-pkg', version: '2.0.0' },
  ];

  it('classifies packages correctly', () => {
    const report = analyzeFreshness(packages);
    expect(report.fresh).toBe(1);
    expect(report.aging).toBe(1);
    expect(report.stale).toBe(1);
    expect(report.unknown).toBe(1);
  });

  it('returns correct number of entries', () => {
    const report = analyzeFreshness(packages);
    expect(report.entries).toHaveLength(4);
  });

  it('handles empty input', () => {
    const report = analyzeFreshness([]);
    expect(report.entries).toHaveLength(0);
    expect(report.fresh).toBe(0);
  });
});

describe('formatFreshnessReport', () => {
  it('includes summary counts', () => {
    const report = analyzeFreshness([
      { name: 'pkg', version: '1.0.0', publishedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    ]);
    const output = formatFreshnessReport(report);
    expect(output).toContain('Fresh: 1');
    expect(output).toContain('pkg@1.0.0');
    expect(output).toContain('FRESH');
  });
});
