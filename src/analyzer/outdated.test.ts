import {
  classifyOutdated,
  countVersionsBehind,
  analyzeOutdated,
  OutdatedReport,
} from './outdated';
import { DependencyChange } from '../diff/compare';

describe('classifyOutdated', () => {
  it('returns major when major version increased', () => {
    expect(classifyOutdated('pkg', '1.2.3', '2.0.0')).toBe('major');
  });

  it('returns minor when minor version increased', () => {
    expect(classifyOutdated('pkg', '1.2.3', '1.5.0')).toBe('minor');
  });

  it('returns patch when only patch version increased', () => {
    expect(classifyOutdated('pkg', '1.2.3', '1.2.9')).toBe('patch');
  });

  it('returns unknown for malformed versions', () => {
    expect(classifyOutdated('pkg', 'invalid', 'also-invalid')).toBe('unknown');
  });

  it('handles semver prefixes like ^', () => {
    expect(classifyOutdated('pkg', '^1.0.0', '^2.0.0')).toBe('major');
  });
});

describe('countVersionsBehind', () => {
  it('returns a positive number when latest is ahead', () => {
    const result = countVersionsBehind('1.0.0', '2.0.0');
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 when versions are equal', () => {
    expect(countVersionsBehind('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns 0 when current is ahead of latest', () => {
    expect(countVersionsBehind('2.0.0', '1.0.0')).toBe(0);
  });
});

describe('analyzeOutdated', () => {
  const changes: DependencyChange[] = [
    { name: 'react', type: 'updated', oldVersion: '17.0.0', newVersion: '18.0.0' },
    { name: 'lodash', type: 'updated', oldVersion: '4.17.20', newVersion: '4.17.21' },
    { name: 'axios', type: 'added', oldVersion: undefined, newVersion: '1.0.0' },
    { name: 'express', type: 'removed', oldVersion: '4.18.0', newVersion: undefined },
    { name: 'typescript', type: 'updated', oldVersion: '4.9.0', newVersion: '5.0.0' },
  ];

  let report: OutdatedReport;

  beforeEach(() => {
    report = analyzeOutdated(changes);
  });

  it('only counts updated dependencies', () => {
    expect(report.total).toBe(3);
  });

  it('groups items by severity', () => {
    expect(report.byseverity.major.length).toBe(2);
    expect(report.byserver).toBeUndefined();
    expect(report.byseverity.patch.length).toBe(1);
  });

  it('includes correct info for each item', () => {
    const lodash = report.items.find((i) => i.name === 'lodash');
    expect(lodash).toBeDefined();
    expect(lodash?.severity).toBe('patch');
    expect(lodash?.current).toBe('4.17.20');
    expect(lodash?.latest).toBe('4.17.21');
  });

  it('returns empty report for no changes', () => {
    const empty = analyzeOutdated([]);
    expect(empty.total).toBe(0);
    expect(empty.items).toHaveLength(0);
  });
});
