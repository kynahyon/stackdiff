import {
  buildDependencyGraph,
  findDependents,
  getTransitiveDependencies,
  formatGraphReport,
} from './graph';
import { DependencyMap } from '../parser/lockfile';

const sampleDeps: DependencyMap = {
  react: '18.2.0',
  'react-dom': '18.2.0',
  lodash: '4.17.21',
  typescript: '5.0.0',
};

describe('buildDependencyGraph', () => {
  it('creates a node for each dependency', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(Object.keys(graph.nodes)).toHaveLength(4);
    expect(graph.nodes['react'].version).toBe('18.2.0');
  });

  it('sets all packages as roots', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(graph.roots).toHaveLength(4);
  });

  it('initializes empty dependents and dependencies', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(graph.nodes['lodash'].dependents).toEqual([]);
    expect(graph.nodes['lodash'].dependencies).toEqual([]);
  });
});

describe('findDependents', () => {
  it('returns empty array for package with no dependents', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(findDependents(graph, 'react')).toEqual([]);
  });

  it('returns empty array for unknown package', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(findDependents(graph, 'unknown-pkg')).toEqual([]);
  });
});

describe('getTransitiveDependencies', () => {
  it('returns empty for leaf node', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(getTransitiveDependencies(graph, 'lodash')).toEqual([]);
  });

  it('handles unknown package gracefully', () => {
    const graph = buildDependencyGraph(sampleDeps);
    expect(getTransitiveDependencies(graph, 'nonexistent')).toEqual([]);
  });

  it('avoids infinite loops with circular references', () => {
    const graph = buildDependencyGraph(sampleDeps);
    graph.nodes['react'].dependencies = ['react-dom'];
    graph.nodes['react-dom'].dependencies = ['react'];
    const result = getTransitiveDependencies(graph, 'react');
    expect(result).toContain('react-dom');
  });
});

describe('formatGraphReport', () => {
  it('includes total package count', () => {
    const graph = buildDependencyGraph(sampleDeps);
    const report = formatGraphReport(graph);
    expect(report).toContain('Total packages: 4');
  });

  it('truncates long root lists', () => {
    const many: DependencyMap = {};
    for (let i = 0; i < 15; i++) many[`pkg-${i}`] = '1.0.0';
    const graph = buildDependencyGraph(many);
    const report = formatGraphReport(graph);
    expect(report).toContain('and 5 more');
  });
});
