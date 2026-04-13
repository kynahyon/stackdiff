import { DependencyMap } from '../parser/lockfile';

export type EngineField = 'node' | 'npm' | 'yarn' | string;

export interface EngineConstraint {
  packageName: string;
  engine: EngineField;
  constraint: string;
}

export interface EngineConflict {
  engine: EngineField;
  packages: Array<{ name: string; constraint: string }>;
  conflicting: boolean;
}

export interface EnginesReport {
  constraints: EngineConstraint[];
  conflicts: EngineConflict[];
  summary: string;
}

export function extractEngineConstraints(
  deps: DependencyMap
): EngineConstraint[] {
  const constraints: EngineConstraint[] = [];
  for (const [name, info] of Object.entries(deps)) {
    const engines = (info as Record<string, unknown>).engines as
      | Record<string, string>
      | undefined;
    if (engines && typeof engines === 'object') {
      for (const [engine, constraint] of Object.entries(engines)) {
        constraints.push({ packageName: name, engine, constraint });
      }
    }
  }
  return constraints;
}

export function detectEngineConflicts(
  constraints: EngineConstraint[]
): EngineConflict[] {
  const byEngine = new Map<string, Array<{ name: string; constraint: string }>>();
  for (const { packageName, engine, constraint } of constraints) {
    if (!byEngine.has(engine)) byEngine.set(engine, []);
    byEngine.get(engine)!.push({ name: packageName, constraint });
  }

  const conflicts: EngineConflict[] = [];
  for (const [engine, packages] of byEngine.entries()) {
    const unique = new Set(packages.map((p) => p.constraint));
    conflicts.push({
      engine,
      packages,
      conflicting: unique.size > 1,
    });
  }
  return conflicts;
}

export function analyzeEngines(deps: DependencyMap): EnginesReport {
  const constraints = extractEngineConstraints(deps);
  const conflicts = detectEngineConflicts(constraints);
  const conflictCount = conflicts.filter((c) => c.conflicting).length;
  const summary =
    conflictCount === 0
      ? `No engine conflicts found across ${constraints.length} constraint(s).`
      : `${conflictCount} engine conflict(s) detected across ${constraints.length} constraint(s).`;
  return { constraints, conflicts, summary };
}

export function formatEnginesReport(report: EnginesReport): string {
  const lines: string[] = ['## Engine Constraints Report', '', report.summary, ''];
  for (const conflict of report.conflicts) {
    const status = conflict.conflicting ? '⚠️  CONFLICT' : '✅ OK';
    lines.push(`### ${conflict.engine} [${status}]`);
    for (const pkg of conflict.packages) {
      lines.push(`  - ${pkg.name}: ${pkg.constraint}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
