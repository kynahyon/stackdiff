import { DependencyMap } from '../parser/lockfile';

export interface DependencyNode {
  name: string;
  version: string;
  dependents: string[];
  dependencies: string[];
  depth: number;
}

export interface DependencyGraph {
  nodes: Record<string, DependencyNode>;
  roots: string[];
}

export function buildDependencyGraph(deps: DependencyMap): DependencyGraph {
  const nodes: Record<string, DependencyNode> = {};

  for (const [name, version] of Object.entries(deps)) {
    nodes[name] = {
      name,
      version,
      dependents: [],
      dependencies: [],
      depth: 0,
    };
  }

  const roots = Object.keys(nodes);

  return { nodes, roots };
}

export function findDependents(
  graph: DependencyGraph,
  packageName: string
): string[] {
  return graph.nodes[packageName]?.dependents ?? [];
}

export function getTransitiveDependencies(
  graph: DependencyGraph,
  packageName: string,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(packageName)) return [];
  visited.add(packageName);

  const node = graph.nodes[packageName];
  if (!node) return [];

  const result: string[] = [...node.dependencies];
  for (const dep of node.dependencies) {
    result.push(...getTransitiveDependencies(graph, dep, visited));
  }

  return [...new Set(result)];
}

export function formatGraphReport(graph: DependencyGraph): string {
  const lines: string[] = ['Dependency Graph Report', '======================'];
  lines.push(`Total packages: ${Object.keys(graph.nodes).length}`);
  lines.push(`Root packages: ${graph.roots.length}`);
  for (const root of graph.roots.slice(0, 10)) {
    lines.push(`  - ${root}@${graph.nodes[root].version}`);
  }
  if (graph.roots.length > 10) {
    lines.push(`  ... and ${graph.roots.length - 10} more`);
  }
  return lines.join('\n');
}
