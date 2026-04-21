import {
  isAlias,
  parseAlias,
  analyzeAliases,
  formatAliasReport,
} from './aliases';
import { Dependency } from '../parser';

const makeDep = (name: string, version = '1.0.0'): Dependency => ({
  name,
  version,
  dependencies: {},
});

describe('isAlias', () => {
  it('returns true for npm alias syntax', () => {
    expect(isAlias('my-lodash@npm:lodash@4.17.21')).toBe(true);
  });

  it('returns true for github alias syntax', () => {
    expect(isAlias('my-pkg@github:owner/repo')).toBe(true);
  });

  it('returns false for regular package name', () => {
    expect(isAlias('lodash')).toBe(false);
    expect(isAlias('react@18.0.0')).toBe(false);
  });
});

describe('parseAlias', () => {
  it('parses npm alias correctly', () => {
    const result = parseAlias('my-lodash@npm:lodash@4.17.21', '4.17.21');
    expect(result).toEqual({
      name: 'my-lodash@npm:lodash@4.17.21',
      alias: 'my-lodash',
      version: '4.17.21',
      resolvedName: 'lodash',
    });
  });

  it('parses github alias correctly', () => {
    const result = parseAlias('my-pkg@github:owner/repo', 'abc123');
    expect(result).toEqual({
      name: 'my-pkg@github:owner/repo',
      alias: 'my-pkg',
      version: 'abc123',
      resolvedName: 'owner/repo',
    });
  });

  it('returns null for non-alias string', () => {
    expect(parseAlias('lodash', '4.17.21')).toBeNull();
  });
});

describe('analyzeAliases', () => {
  it('identifies aliased packages among deps', () => {
    const deps: Dependency[] = [
      makeDep('lodash', '4.17.21'),
      makeDep('my-lodash@npm:lodash@4.17.21', '4.17.21'),
      makeDep('old-react@npm:react@16.14.0', '16.14.0'),
    ];
    const result = analyzeAliases(deps);
    expect(result.total).toBe(2);
    expect(result.uniqueResolved).toBe(2);
    expect(result.aliases[0].alias).toBe('my-lodash');
  });

  it('returns zero totals when no aliases present', () => {
    const deps = [makeDep('express', '4.18.0'), makeDep('lodash', '4.17.21')];
    const result = analyzeAliases(deps);
    expect(result.total).toBe(0);
    expect(result.uniqueResolved).toBe(0);
  });
});

describe('formatAliasReport', () => {
  it('returns a no-alias message when empty', () => {
    const report = formatAliasReport({ aliases: [], total: 0, uniqueResolved: 0 });
    expect(report).toContain('No aliased packages found');
  });

  it('lists aliases in the report', () => {
    const analysis = analyzeAliases([
      makeDep('my-lodash@npm:lodash@4.17.21', '4.17.21'),
    ]);
    const report = formatAliasReport(analysis);
    expect(report).toContain('my-lodash -> lodash@4.17.21');
    expect(report).toContain('Aliased Packages: 1');
  });
});
