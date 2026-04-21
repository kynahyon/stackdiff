import { Dependency } from '../parser';

export type OptionalStatus = 'optional' | 'required' | 'unknown';

export interface OptionalEntry {
  name: string;
  version: string;
  status: OptionalStatus;
  inOptionalDeps: boolean;
  inPeerDeps: boolean;
}

export interface OptionalAnalysis {
  total: number;
  optional: OptionalEntry[];
  required: OptionalEntry[];
  summary: {
    optionalCount: number;
    requiredCount: number;
    unknownCount: number;
  };
}

export function classifyOptionalStatus(
  name: string,
  optionalDeps: Record<string, string>,
  peerDeps: Record<string, string>
): OptionalStatus {
  if (name in optionalDeps) return 'optional';
  if (name in peerDeps) return 'optional';
  return 'required';
}

export function analyzeOptional(
  deps: Dependency[],
  optionalDeps: Record<string, string> = {},
  peerDeps: Record<string, string> = {}
): OptionalAnalysis {
  const entries: OptionalEntry[] = deps.map((dep) => ({
    name: dep.name,
    version: dep.version,
    status: classifyOptionalStatus(dep.name, optionalDeps, peerDeps),
    inOptionalDeps: dep.name in optionalDeps,
    inPeerDeps: dep.name in peerDeps,
  }));

  const optional = entries.filter((e) => e.status === 'optional');
  const required = entries.filter((e) => e.status === 'required');
  const unknown = entries.filter((e) => e.status === 'unknown');

  return {
    total: entries.length,
    optional,
    required,
    summary: {
      optionalCount: optional.length,
      requiredCount: required.length,
      unknownCount: unknown.length,
    },
  };
}

export function formatOptionalReport(analysis: OptionalAnalysis): string {
  const lines: string[] = [
    `Optional Dependency Analysis`,
    `Total: ${analysis.total} | Optional: ${analysis.summary.optionalCount} | Required: ${analysis.summary.requiredCount}`,
    '',
  ];

  if (analysis.optional.length > 0) {
    lines.push('Optional:');
    for (const e of analysis.optional) {
      const tags = [e.inOptionalDeps && 'optionalDependencies', e.inPeerDeps && 'peerDependencies']
        .filter(Boolean)
        .join(', ');
      lines.push(`  ${e.name}@${e.version}  [${tags}]`);
    }
    lines.push('');
  }

  if (analysis.required.length > 0) {
    lines.push('Required:');
    for (const e of analysis.required) {
      lines.push(`  ${e.name}@${e.version}`);
    }
  }

  return lines.join('\n');
}
