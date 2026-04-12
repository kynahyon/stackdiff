import {
  classifyPinStatus,
  analyzePinned,
  formatPinnedReport,
} from './pinned';

describe('classifyPinStatus', () => {
  it('returns exact for pinned version', () => {
    expect(classifyPinStatus('1.2.3')).toBe('exact');
  });

  it('returns range for caret range', () => {
    expect(classifyPinStatus('^1.2.3')).toBe('range');
  });

  it('returns range for tilde range', () => {
    expect(classifyPinStatus('~1.2.3')).toBe('range');
  });

  it('returns wildcard for *', () => {
    expect(classifyPinStatus('*')).toBe('wildcard');
  });

  it('returns wildcard for latest', () => {
    expect(classifyPinStatus('latest')).toBe('wildcard');
  });

  it('returns unknown for empty string', () => {
    expect(classifyPinStatus('')).toBe('wildcard');
  });
});

describe('analyzePinned', () => {
  const deps = {
    react: '18.2.0',
    lodash: '^4.17.21',
    axios: '~1.4.0',
    typescript: '*',
  };

  it('counts statuses correctly', () => {
    const report = analyzePinned(deps);
    expect(report.total).toBe(4);
    expect(report.exact).toBe(1);
    expect(report.range).toBe(2);
    expect(report.wildcard).toBe(1);
  });

  it('assigns recommendation for wildcard', () => {
    const report = analyzePinned(deps);
    const ts = report.entries.find((e) => e.name === 'typescript');
    expect(ts?.recommendation).toMatch(/Pin to a specific version/);
  });

  it('assigns recommendation for range', () => {
    const report = analyzePinned(deps);
    const lodash = report.entries.find((e) => e.name === 'lodash');
    expect(lodash?.recommendation).toMatch(/Consider pinning/);
  });

  it('has no recommendation for exact', () => {
    const report = analyzePinned(deps);
    const react = report.entries.find((e) => e.name === 'react');
    expect(react?.recommendation).toBeUndefined();
  });
});

describe('formatPinnedReport', () => {
  it('shows all-pinned message when everything is exact', () => {
    const report = analyzePinned({ react: '18.2.0', lodash: '4.17.21' });
    const output = formatPinnedReport(report);
    expect(output).toContain('All dependencies are pinned');
  });

  it('lists unpinned dependencies', () => {
    const report = analyzePinned({ react: '^18.2.0', lodash: '4.17.21' });
    const output = formatPinnedReport(report);
    expect(output).toContain('react');
    expect(output).toContain('[range]');
  });
});
