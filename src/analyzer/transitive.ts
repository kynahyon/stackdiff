import { DependencyGraph } from './graph';

export interface TransitiveResult {
  name: string;
  version: string;
  depth: number;
  introducedBy: string[];
}

export interface TransitiveAnalysis {
  total: number;
  direct: number;
  transitive: number;
  maxDepth: number;
  entries: TransitiveResult[];
}

export function collectTransitive(
  graph: DependencyGraph,
  roots: string[],
  maxDepth = 10
): TransitiveResult[] {
  const visited = new Map<string, TransitiveResult>();

  function dfs(name: string, depth: number, introducedBy: string): void {
    if (depth > maxDepth) return;
    const deps = graph[name] ?? [];
    for (const dep of deps) {
      if (visited.has(dep.name)) {
        const entry = visited.get(dep.name)!;
        if (!entry.introducedBy.includes(introducedBy)) {
          entry.introducedBy.push(introducedBy);
        }
        continue;
      }
      visited.set(dep.name, {
        name: dep.name,
        version: dep.version,
        depth,
        introducedBy: [introducedBy],
      });
      dfs(dep.name, depth + 1, introducedBy);
    }
  }

  for (const root of roots) {
    dfs(root, 1, root);
  }

  return Array.from(visited.values()).sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
}

export function analyzeTransitive(
  graph: DependencyGraph,
  directDeps: string[]
): TransitiveAnalysis {
  const entries = collectTransitive(graph, directDeps);
  const maxDepth = entries.reduce((m, e) => Math.max(m, e.depth), 0);
  const transitive = entries.filter(e => e.depth > 1).length;

  return {
    total: directDeps.length + entries.length,
    direct: directDeps.length,
    transitive,
    maxDepth,
    entries,
  };
}

export function formatTransitiveReport(analysis: TransitiveAnalysis): string {
  const lines: string[] = [
    `Transitive Dependency Analysis`,
    `  Total:      ${analysis.total}`,
    `  Direct:     ${analysis.direct}`,
    `  Transitive: ${analysis.transitive}`,
    `  Max Depth:  ${analysis.maxDepth}`,
    '',
    'Transitive packages:',
  ];

  for (const entry of analysis.entries) {
    const via = entry.introducedBy.join(', ');
    lines.push(`  ${'  '.repeat(entry.depth - 1)}${entry.name}@${entry.version} (via ${via})`);
  }

  return lines.join('\n');
}
