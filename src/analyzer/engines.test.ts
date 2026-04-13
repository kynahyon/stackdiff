import {
  extractEngineConstraints,
  detectEngineConflicts,
  analyzeEngines,
  formatEnginesReport,
} from './engines';
import { DependencyMap } from '../parser/lockfile';

const mockDeps: DependencyMap = {
  express: { version: '4.18.0', engines: { node: '>=14.0.0' } } as never,
  lodash: { version: '4.17.21' } as never,
  react: { version: '18.0.0', engines: { node: '>=12.0.0', npm: '>=6' } } as never,
  legacy: { version: '1.0.0', engines: { node: '>=8.0.0' } } as never,
};

describe('extractEngineConstraints', () => {
  it('extracts engine constraints from packages that define them', () => {
    const result = extractEngineConstraints(mockDeps);
    expect(result.length).toBe(4);
    expect(result).toContainEqual({ packageName: 'express', engine: 'node', constraint: '>=14.0.0' });
    expect(result).toContainEqual({ packageName: 'react', engine: 'npm', constraint: '>=6' });
  });

  it('skips packages without engines field', () => {
    const result = extractEngineConstraints(mockDeps);
    const names = result.map((r) => r.packageName);
    expect(names).not.toContain('lodash');
  });

  it('returns empty array for empty deps', () => {
    expect(extractEngineConstraints({})).toEqual([]);
  });
});

describe('detectEngineConflicts', () => {
  it('marks engine as conflicting when constraints differ', () => {
    const constraints = extractEngineConstraints(mockDeps);
    const conflicts = detectEngineConflicts(constraints);
    const nodeConflict = conflicts.find((c) => c.engine === 'node');
    expect(nodeConflict).toBeDefined();
    expect(nodeConflict!.conflicting).toBe(true);
  });

  it('marks engine as not conflicting when all constraints are identical', () => {
    const constraints = [
      { packageName: 'a', engine: 'node', constraint: '>=14' },
      { packageName: 'b', engine: 'node', constraint: '>=14' },
    ];
    const conflicts = detectEngineConflicts(constraints);
    expect(conflicts[0].conflicting).toBe(false);
  });
});

describe('analyzeEngines', () => {
  it('returns summary with conflict count', () => {
    const report = analyzeEngines(mockDeps);
    expect(report.summary).toMatch(/conflict/);
    expect(report.constraints.length).toBeGreaterThan(0);
  });

  it('reports no conflicts when all constraints match', () => {
    const deps: DependencyMap = {
      a: { version: '1.0.0', engines: { node: '>=16' } } as never,
      b: { version: '2.0.0', engines: { node: '>=16' } } as never,
    };
    const report = analyzeEngines(deps);
    expect(report.summary).toMatch(/No engine conflicts/);
  });
});

describe('formatEnginesReport', () => {
  it('includes the summary in output', () => {
    const report = analyzeEngines(mockDeps);
    const output = formatEnginesReport(report);
    expect(output).toContain('Engine Constraints Report');
    expect(output).toContain(report.summary);
  });

  it('marks conflicting engines with warning', () => {
    const report = analyzeEngines(mockDeps);
    const output = formatEnginesReport(report);
    expect(output).toContain('CONFLICT');
  });
});
