import { analyzeCve, formatCveReport, rankCveSeverity, CveEntry } from './cve';
import { Dependency } from '../parser';

const dep = (name: string, version = '1.0.0'): Dependency => ({ name, version, resolved: '', integrity: '' });

describe('rankCveSeverity', () => {
  it('ranks critical highest', () => {
    expect(rankCveSeverity('critical')).toBeGreaterThan(rankCveSeverity('high'));
  });

  it('ranks none lowest', () => {
    expect(rankCveSeverity('none')).toBe(0);
  });
});

describe('analyzeCve', () => {
  it('returns empty analysis for unknown packages', () => {
    const result = analyzeCve([dep('some-safe-package')]);
    expect(result.total).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it('detects lodash CVE', () => {
    const result = analyzeCve([dep('lodash', '4.17.20')]);
    expect(result.total).toBe(1);
    expect(result.entries[0].cveId).toBe('CVE-2021-23337');
    expect(result.entries[0].severity).toBe('high');
  });

  it('detects minimist as critical', () => {
    const result = analyzeCve([dep('minimist', '1.2.5')]);
    expect(result.critical).toBe(1);
  });

  it('counts severities correctly across multiple deps', () => {
    const result = analyzeCve([dep('lodash'), dep('minimist'), dep('axios'), dep('react')]);
    expect(result.critical).toBe(1);
    expect(result.high).toBe(1);
    expect(result.medium).toBe(1);
    expect(result.total).toBe(3);
  });

  it('returns empty for empty input', () => {
    const result = analyzeCve([]);
    expect(result.total).toBe(0);
  });
});

describe('formatCveReport', () => {
  it('reports no CVEs when analysis is clean', () => {
    const analysis = { entries: [], critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    expect(formatCveReport(analysis)).toContain('No known CVEs');
  });

  it('includes CVE id and severity in output', () => {
    const result = analyzeCve([dep('lodash')]);
    const report = formatCveReport(result);
    expect(report).toContain('CVE-2021-23337');
    expect(report).toContain('HIGH');
  });

  it('sorts entries by severity descending', () => {
    const result = analyzeCve([dep('axios'), dep('minimist')]);
    const report = formatCveReport(result);
    const critIdx = report.indexOf('CRITICAL');
    const medIdx = report.indexOf('MEDIUM');
    expect(critIdx).toBeLessThan(medIdx);
  });

  it('includes summary line', () => {
    const result = analyzeCve([dep('minimist')]);
    const report = formatCveReport(result);
    expect(report).toContain('Summary:');
    expect(report).toContain('1 critical');
  });
});
