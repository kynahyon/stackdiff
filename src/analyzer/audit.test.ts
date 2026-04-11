import { auditChanges, formatAuditReport, getHighestSeverity, rankSeverity, AuditVulnerability } from './audit';
import { DependencyChange } from '../diff/compare';

const changes: DependencyChange[] = [
  { name: 'lodash', type: 'updated', from: '4.17.15', to: '4.17.21' },
  { name: 'express', type: 'added', from: undefined, to: '4.18.0' },
  { name: 'axios', type: 'removed', from: '0.27.0', to: undefined },
];

const vulns: AuditVulnerability[] = [
  { package: 'lodash', severity: 'high', description: 'Prototype pollution', fixedIn: '4.17.21' },
  { package: 'lodash', severity: 'moderate', description: 'ReDoS vulnerability' },
  { package: 'express', severity: 'low', description: 'Minor info disclosure' },
];

describe('rankSeverity', () => {
  it('ranks critical before high', () => {
    expect(rankSeverity('critical', 'high')).toBeLessThan(0);
  });

  it('ranks info after low', () => {
    expect(rankSeverity('info', 'low')).toBeGreaterThan(0);
  });

  it('returns 0 for same severity', () => {
    expect(rankSeverity('moderate', 'moderate')).toBe(0);
  });
});

describe('getHighestSeverity', () => {
  it('returns null for empty list', () => {
    expect(getHighestSeverity([])).toBeNull();
  });

  it('returns highest severity from list', () => {
    expect(getHighestSeverity(vulns.filter((v) => v.package === 'lodash'))).toBe('high');
  });

  it('returns single severity correctly', () => {
    expect(getHighestSeverity([{ package: 'x', severity: 'critical', description: 'test' }])).toBe('critical');
  });
});

describe('auditChanges', () => {
  it('returns results only for packages with vulnerabilities', () => {
    const summary = auditChanges(changes, vulns);
    expect(summary.results).toHaveLength(2);
    expect(summary.results.map((r) => r.package)).toContain('lodash');
    expect(summary.results.map((r) => r.package)).toContain('express');
  });

  it('skips removed packages', () => {
    const axiosVulns: AuditVulnerability[] = [
      { package: 'axios', severity: 'high', description: 'SSRF' },
    ];
    const summary = auditChanges(changes, [...vulns, ...axiosVulns]);
    expect(summary.results.map((r) => r.package)).not.toContain('axios');
  });

  it('counts total vulnerabilities correctly', () => {
    const summary = auditChanges(changes, vulns);
    expect(summary.totalVulnerabilities).toBe(3);
  });

  it('groups by severity', () => {
    const summary = auditChanges(changes, vulns);
    expect(summary.bySeverity.high).toBe(1);
    expect(summary.bySeverity.moderate).toBe(1);
    expect(summary.bySeverity.low).toBe(1);
  });

  it('returns empty summary when no vulnerabilities match', () => {
    const summary = auditChanges(changes, []);
    expect(summary.totalVulnerabilities).toBe(0);
    expect(summary.results).toHaveLength(0);
  });
});

describe('formatAuditReport', () => {
  it('shows clean message when no vulnerabilities', () => {
    const summary = auditChanges(changes, []);
    expect(formatAuditReport(summary)).toContain('No vulnerabilities found');
  });

  it('includes package names and severities in report', () => {
    const summary = auditChanges(changes, vulns);
    const report = formatAuditReport(summary);
    expect(report).toContain('lodash');
    expect(report).toContain('HIGH');
    expect(report).toContain('fixed in 4.17.21');
  });

  it('includes total count in report', () => {
    const summary = auditChanges(changes, vulns);
    const report = formatAuditReport(summary);
    expect(report).toContain('3 vulnerability(ies)');
  });
});
