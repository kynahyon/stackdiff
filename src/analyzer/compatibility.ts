import { Dependency } from '../parser';

export type NodeRange = 'legacy' | 'lts' | 'current' | 'unknown';

export interface CompatibilityResult {
  name: string;
  version: string;
  engines?: string;
  nodeRange: NodeRange;
  compatible: boolean;
  reason?: string;
}

export interface CompatibilityReport {
  runtimeVersion: string;
  results: CompatibilityResult[];
  incompatibleCount: number;
  unknownCount: number;
}

const NODE_RANGE_PATTERNS: Record<NodeRange, RegExp[]> = {
  legacy: [/>=?\s*0\./, />=?\s*[1-9]\s*\./, />=?\s*1[01]\./],
  lts: [/>=?\s*1[468]\./, />=?\s*20\./],
  current: [/>=?\s*2[12]\./],
  unknown: [],
};

export function classifyNodeRange(engines: string | undefined): NodeRange {
  if (!engines) return 'unknown';
  for (const [range, patterns] of Object.entries(NODE_RANGE_PATTERNS) as [NodeRange, RegExp[]][]) {
    if (range === 'unknown') continue;
    if (patterns.some((p) => p.test(engines))) return range;
  }
  return 'unknown';
}

export function isCompatibleWithRuntime(engines: string | undefined, runtimeVersion: string): boolean {
  if (!engines) return true;
  const match = engines.match(/>=(\d+)/);
  if (!match) return true;
  const minMajor = parseInt(match[1], 10);
  const runtimeMajor = parseInt(runtimeVersion.replace(/^v/, '').split('.')[0], 10);
  return runtimeMajor >= minMajor;
}

export function analyzeCompatibility(
  deps: Dependency[],
  runtimeVersion: string
): CompatibilityReport {
  const results: CompatibilityResult[] = deps.map((dep) => {
    const engines = (dep as any).engines?.node as string | undefined;
    const nodeRange = classifyNodeRange(engines);
    const compatible = isCompatibleWithRuntime(engines, runtimeVersion);
    return {
      name: dep.name,
      version: dep.version,
      engines,
      nodeRange,
      compatible,
      reason: compatible ? undefined : `Requires Node ${engines}, runtime is ${runtimeVersion}`,
    };
  });

  return {
    runtimeVersion,
    results,
    incompatibleCount: results.filter((r) => !r.compatible).length,
    unknownCount: results.filter((r) => r.nodeRange === 'unknown').length,
  };
}

export function formatCompatibilityReport(report: CompatibilityReport): string {
  const lines: string[] = [
    `## Compatibility Report (Node ${report.runtimeVersion})`,
    ``,
    `- Incompatible: ${report.incompatibleCount}`,
    `- Unknown engine constraint: ${report.unknownCount}`,
    ``,
  ];

  const incompatible = report.results.filter((r) => !r.compatible);
  if (incompatible.length === 0) {
    lines.push('✅ All packages compatible with runtime.');
  } else {
    lines.push('### Incompatible Packages');
    for (const r of incompatible) {
      lines.push(`  - ${r.name}@${r.version}: ${r.reason}`);
    }
  }

  return lines.join('\n');
}
