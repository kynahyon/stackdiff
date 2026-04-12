import { detectCircularDependencies, formatCircularReport } from './circular';
import { DependencyGraph } from './graph';

describe('detectCircularDependencies', () => {
  it('returns no cycles for an empty graph', () => {
    const result = detectCircularDependencies({});
    expect(result.hasCircular).toBe(false);
    expect(result.cycles).toHaveLength(0);
    expect(result.affectedPackages).toHaveLength(0);
  });

  it('returns no cycles for a linear chain', () => {
    const graph: DependencyGraph = {
      a: ['b'],
      b: ['c'],
      c: [],
    };
    const result = detectCircularDependencies(graph);
    expect(result.hasCircular).toBe(false);
  });

  it('detects a simple two-node cycle', () => {
    const graph: DependencyGraph = {
      a: ['b'],
      b: ['a'],
    };
    const result = detectCircularDependencies(graph);
    expect(result.hasCircular).toBe(true);
    expect(result.cycles.length).toBeGreaterThan(0);
    expect(result.affectedPackages).toContain('a');
    expect(result.affectedPackages).toContain('b');
  });

  it('detects a longer cycle', () => {
    const graph: DependencyGraph = {
      a: ['b'],
      b: ['c'],
      c: ['a'],
    };
    const result = detectCircularDependencies(graph);
    expect(result.hasCircular).toBe(true);
    const chain = result.cycles[0].chain;
    expect(chain[0]).toBe(chain[chain.length - 1]);
  });

  it('does not flag unrelated nodes as affected', () => {
    const graph: DependencyGraph = {
      a: ['b'],
      b: ['a'],
      c: ['d'],
      d: [],
    };
    const result = detectCircularDependencies(graph);
    expect(result.affectedPackages).not.toContain('c');
    expect(result.affectedPackages).not.toContain('d');
  });
});

describe('formatCircularReport', () => {
  it('returns success message when no cycles', () => {
    const report = formatCircularReport({ hasCircular: false, cycles: [], affectedPackages: [] });
    expect(report).toContain('No circular dependencies');
  });

  it('includes cycle details when cycles exist', () => {
    const analysis = {
      hasCircular: true,
      cycles: [{ chain: ['a', 'b', 'a'], length: 2 }],
      affectedPackages: ['a', 'b'],
    };
    const report = formatCircularReport(analysis);
    expect(report).toContain('Cycle 1');
    expect(report).toContain('a → b → a');
    expect(report).toContain('Affected packages');
  });
});
