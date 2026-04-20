import {
  getMajor,
  calculateEntropy,
  classifyEntropyRisk,
  analyzeEntropy,
  formatEntropyReport,
} from './entropy';
import { Dependency } from '../parser';

function dep(name: string, version: string): Dependency {
  return { name, version, type: 'dependency' };
}

describe('getMajor', () => {
  it('extracts major version from plain version', () => {
    expect(getMajor('3.2.1')).toBe(3);
  });

  it('strips leading non-digit characters', () => {
    expect(getMajor('^2.0.0')).toBe(2);
    expect(getMajor('~1.4.0')).toBe(1);
  });

  it('returns 0 for unparseable version', () => {
    expect(getMajor('latest')).toBe(0);
  });
});

describe('calculateEntropy', () => {
  it('returns 0 for a single version', () => {
    expect(calculateEntropy(['1.0.0'])).toBe(0);
  });

  it('returns 0 for identical versions', () => {
    expect(calculateEntropy(['2.0.0', '2.1.0', '2.3.0'])).toBe(0);
  });

  it('returns > 0 when multiple major versions exist', () => {
    const score = calculateEntropy(['1.0.0', '2.0.0', '3.0.0']);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns 1 for fully unique majors', () => {
    expect(calculateEntropy(['1.0.0', '2.0.0'])).toBe(1);
  });
});

describe('classifyEntropyRisk', () => {
  it('classifies low risk', () => expect(classifyEntropyRisk(0.1)).toBe('low'));
  it('classifies medium risk', () => expect(classifyEntropyRisk(0.4)).toBe('medium'));
  it('classifies high risk', () => expect(classifyEntropyRisk(0.8)).toBe('high'));
});

describe('analyzeEntropy', () => {
  it('groups dependencies by name', () => {
    const deps = [dep('lodash', '4.0.0'), dep('lodash', '3.0.0'), dep('react', '18.0.0')];
    const report = analyzeEntropy(deps);
    expect(report.entries).toHaveLength(2);
  });

  it('calculates high entropy for mixed major versions', () => {
    const deps = [dep('pkg', '1.0.0'), dep('pkg', '2.0.0')];
    const report = analyzeEntropy(deps);
    expect(report.entries[0].risk).toBe('high');
    expect(report.highRiskCount).toBe(1);
  });

  it('handles empty dependency list', () => {
    const report = analyzeEntropy([]);
    expect(report.entries).toHaveLength(0);
    expect(report.averageEntropy).toBe(0);
  });

  it('sorts entries by entropy score descending', () => {
    const deps = [
      dep('stable', '1.0.0'),
      dep('chaotic', '1.0.0'),
      dep('chaotic', '2.0.0'),
    ];
    const report = analyzeEntropy(deps);
    expect(report.entries[0].name).toBe('chaotic');
  });
});

describe('formatEntropyReport', () => {
  it('includes header and average entropy', () => {
    const deps = [dep('a', '1.0.0'), dep('a', '2.0.0')];
    const report = analyzeEntropy(deps);
    const output = formatEntropyReport(report);
    expect(output).toContain('Version Entropy Report');
    expect(output).toContain('Average entropy');
  });

  it('shows no dependencies message when empty', () => {
    const output = formatEntropyReport({ entries: [], averageEntropy: 0, highRiskCount: 0 });
    expect(output).toContain('No dependencies found.');
  });
});
