import { DependencyGraph } from './graph';

export interface CircularChain {
  chain: string[];
  length: number;
}

export interface CircularAnalysis {
  hasCircular: boolean;
  cycles: CircularChain[];
  affectedPackages: string[];
}

export function detectCircularDependencies(graph: DependencyGraph): CircularAnalysis {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: CircularChain[] = [];

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      const chain = [...path.slice(cycleStart), node];
      cycles.push({ chain, length: chain.length - 1 });
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    const deps = graph[node] ?? [];
    for (const dep of deps) {
      dfs(dep, [...path, node]);
    }

    stack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  const affectedPackages = Array.from(
    new Set(cycles.flatMap((c) => c.chain))
  );

  return {
    hasCircular: cycles.length > 0,
    cycles,
    affectedPackages,
  };
}

export function formatCircularReport(analysis: CircularAnalysis): string {
  if (!analysis.hasCircular) {
    return '✅ No circular dependencies detected.';
  }

  const lines: string[] = [
    `⚠️  Circular dependencies detected: ${analysis.cycles.length} cycle(s)`,
    '',
  ];

  analysis.cycles.forEach((cycle, i) => {
    lines.push(`  Cycle ${i + 1} (length ${cycle.length}):`);
    lines.push(`    ${cycle.chain.join(' → ')}`);
  });

  lines.push('');
  lines.push(`Affected packages (${analysis.affectedPackages.length}): ${analysis.affectedPackages.join(', ')}`);

  return lines.join('\n');
}
