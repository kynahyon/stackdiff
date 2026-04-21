import { collectTransitive, analyzeTransitive, formatTransitiveReport } from './transitive';
import { DependencyGraph } from './graph';

const graph: DependencyGraph = {
  react: [
    { name: 'loose-envify', version: '1.4.0' },
    { name: 'object-assign', version: '4.1.1' },
  ],
  'loose-envify': [
    { name: 'js-tokens', version: '4.0.0' },
  ],
  'object-assign': [],
  'js-tokens': [],
  express: [
    { name: 'body-parser', version: '1.20.0' },
  ],
  'body-parser': [
    { name: 'bytes', version: '3.1.2' },
  ],
  bytes: [],
};

describe('collectTransitive', () => {
  it('collects transitive deps from a single root', () => {
    const results = collectTransitive(graph, ['react']);
    const names = results.map(r => r.name);
    expect(names).toContain('loose-envify');
    expect(names).toContain('object-assign');
    expect(names).toContain('js-tokens');
  });

  it('assigns correct depth values', () => {
    const results = collectTransitive(graph, ['react']);
    const looseEnvify = results.find(r => r.name === 'loose-envify')!;
    const jsTokens = results.find(r => r.name === 'js-tokens')!;
    expect(looseEnvify.depth).toBe(1);
    expect(jsTokens.depth).toBe(2);
  });

  it('tracks introducedBy correctly', () => {
    const results = collectTransitive(graph, ['react']);
    const looseEnvify = results.find(r => r.name === 'loose-envify')!;
    expect(looseEnvify.introducedBy).toContain('react');
  });

  it('respects maxDepth', () => {
    const results = collectTransitive(graph, ['react'], 1);
    const names = results.map(r => r.name);
    expect(names).not.toContain('js-tokens');
  });
});

describe('analyzeTransitive', () => {
  it('returns correct totals', () => {
    const analysis = analyzeTransitive(graph, ['react', 'express']);
    expect(analysis.direct).toBe(2);
    expect(analysis.transitive).toBeGreaterThan(0);
    expect(analysis.maxDepth).toBeGreaterThanOrEqual(2);
  });

  it('total equals direct + transitive count', () => {
    const analysis = analyzeTransitive(graph, ['react']);
    expect(analysis.total).toBe(analysis.direct + analysis.entries.length);
  });
});

describe('formatTransitiveReport', () => {
  it('includes header and summary', () => {
    const analysis = analyzeTransitive(graph, ['react']);
    const report = formatTransitiveReport(analysis);
    expect(report).toContain('Transitive Dependency Analysis');
    expect(report).toContain('Direct:');
    expect(report).toContain('Transitive:');
  });

  it('lists transitive packages with version', () => {
    const analysis = analyzeTransitive(graph, ['react']);
    const report = formatTransitiveReport(analysis);
    expect(report).toContain('js-tokens@4.0.0');
  });
});
