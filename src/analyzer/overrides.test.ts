import { detectOverrides, analyzeOverrides, formatOverridesReport } from './overrides';
import { Dependency } from '../parser';

const makeDep = (overrides: Partial<Dependency>): Dependency => ({
  name: 'pkg',
  version: '1.0.0',
  specifier: '1.0.0',
  ...overrides,
} as Dependency);

describe('detectOverrides', () => {
  it('returns empty array when no overrides present', () => {
    const deps = [makeDep({ name: 'react', version: '18.0.0', specifier: '18.0.0' })];
    expect(detectOverrides(deps)).toEqual([]);
  });

  it('detects version mismatch as override', () => {
    const deps = [makeDep({ name: 'lodash', version: '4.17.21', specifier: '^4.0.0', resolved: undefined })];
    const result = detectOverrides(deps);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('lodash');
    expect(result[0].originalVersion).toBe('^4.0.0');
    expect(result[0].overriddenVersion).toBe('4.17.21');
  });

  it('marks nested overrides correctly', () => {
    const deps = [
      makeDep({
        name: 'parent',
        version: '2.0.0',
        specifier: '2.0.0',
        overrides: { 'child-pkg': '1.2.3' },
      }),
    ];
    const result = detectOverrides(deps);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('child-pkg');
    expect(result[0].isNested).toBe(true);
    expect(result[0].overriddenVersion).toBe('1.2.3');
    expect(result[0].path).toBe('parent');
  });
});

describe('analyzeOverrides', () => {
  it('returns zero counts when no overrides', () => {
    const deps = [makeDep({ name: 'a', version: '1.0.0', specifier: '1.0.0' })];
    const report = analyzeOverrides(deps);
    expect(report.totalCount).toBe(0);
    expect(report.nestedCount).toBe(0);
    expect(report.topLevelCount).toBe(0);
  });

  it('correctly counts top-level vs nested', () => {
    const deps = [
      makeDep({ name: 'a', version: '2.0.0', specifier: '^1.0.0', resolved: undefined }),
      makeDep({ name: 'b', version: '1.0.0', specifier: '1.0.0', overrides: { c: '3.0.0' } }),
    ];
    const report = analyzeOverrides(deps);
    expect(report.totalCount).toBe(2);
    expect(report.topLevelCount).toBe(1);
    expect(report.nestedCount).toBe(1);
  });
});

describe('formatOverridesReport', () => {
  it('returns no-overrides message when empty', () => {
    const report = { entries: [], totalCount: 0, nestedCount: 0, topLevelCount: 0 };
    expect(formatOverridesReport(report)).toBe('No overrides detected.');
  });

  it('formats report with entries', () => {
    const report = analyzeOverrides([
      makeDep({ name: 'lodash', version: '4.17.21', specifier: '^4.0.0', resolved: undefined }),
    ]);
    const output = formatOverridesReport(report);
    expect(output).toContain('lodash');
    expect(output).toContain('^4.0.0');
    expect(output).toContain('4.17.21');
    expect(output).toContain('[top-level]');
  });
});
