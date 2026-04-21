import { analyzeHoisting, classifyHoistStatus, formatHoistReport } from './hoisting';
import { Dependency } from '../parser';

const makeDep = (name: string, version: string, requiredBy: string[] = []): Dependency => ({
  name,
  version,
  requiredBy,
  type: 'production',
});

describe('classifyHoistStatus', () => {
  it('returns conflicted when nested versions exist', () => {
    expect(classifyHoistStatus(['a', 'b'], ['2.0.0'])).toBe('conflicted');
  });

  it('returns hoisted when multiple consumers and no conflicts', () => {
    expect(classifyHoistStatus(['a', 'b'], [])).toBe('hoisted');
  });

  it('returns nested for single consumer', () => {
    expect(classifyHoistStatus(['a'], [])).toBe('nested');
  });
});

describe('analyzeHoisting', () => {
  it('counts hoisted packages correctly', () => {
    const deps = [
      makeDep('lodash', '4.17.21', ['a', 'b']),
      makeDep('chalk', '5.0.0', ['c']),
    ];
    const report = analyzeHoisting(deps);
    expect(report.hoistedCount).toBe(1);
    expect(report.nestedCount).toBe(1);
    expect(report.conflictedCount).toBe(0);
  });

  it('detects version conflicts', () => {
    const deps = [
      makeDep('react', '17.0.0', ['app']),
      makeDep('react', '18.0.0', ['lib']),
    ];
    const report = analyzeHoisting(deps);
    expect(report.conflictedCount).toBe(1);
    const entry = report.entries.find(e => e.name === 'react');
    expect(entry?.nestedVersions).toContain('18.0.0');
  });

  it('returns empty report for no deps', () => {
    const report = analyzeHoisting([]);
    expect(report.entries).toHaveLength(0);
    expect(report.hoistedCount).toBe(0);
  });
});

describe('formatHoistReport', () => {
  it('includes summary counts', () => {
    const deps = [makeDep('lodash', '4.0.0', ['a', 'b'])];
    const report = analyzeHoisting(deps);
    const output = formatHoistReport(report);
    expect(output).toContain('Hoisted:');
    expect(output).toContain('Conflicted:');
  });

  it('lists conflicted packages', () => {
    const deps = [
      makeDep('semver', '6.0.0', ['x']),
      makeDep('semver', '7.0.0', ['y']),
    ];
    const report = analyzeHoisting(deps);
    const output = formatHoistReport(report);
    expect(output).toContain('semver@6.0.0');
    expect(output).toContain('7.0.0');
  });
});
