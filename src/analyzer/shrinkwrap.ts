import { Dependency } from '../parser';

export type ShrinkwrapStatus = 'locked' | 'drifted' | 'missing' | 'extra';

export interface ShrinkwrapEntry {
  name: string;
  resolvedVersion: string;
  declaredVersion: string;
  status: ShrinkwrapStatus;
}

export interface ShrinkwrapAnalysis {
  entries: ShrinkwrapEntry[];
  lockedCount: number;
  driftedCount: number;
  missingCount: number;
  extraCount: number;
}

export function classifyShrinkwrapStatus(
  resolvedVersion: string,
  declaredVersion: string | undefined
): ShrinkwrapStatus {
  if (!declaredVersion) return 'extra';
  if (!resolvedVersion) return 'missing';
  const resolved = resolvedVersion.replace(/^[^0-9]*/, '');
  const declared = declaredVersion.replace(/^[~^>=<]*/, '');
  return resolved === declared ? 'locked' : 'drifted';
}

export function analyzeShrinkwrap(
  resolved: Dependency[],
  declared: Dependency[]
): ShrinkwrapAnalysis {
  const declaredMap = new Map(declared.map((d) => [d.name, d.version]));
  const resolvedMap = new Map(resolved.map((d) => [d.name, d.version]));

  const entries: ShrinkwrapEntry[] = [];

  for (const dep of resolved) {
    const declaredVersion = declaredMap.get(dep.name);
    const status = classifyShrinkwrapStatus(dep.version, declaredVersion);
    entries.push({
      name: dep.name,
      resolvedVersion: dep.version,
      declaredVersion: declaredVersion ?? '',
      status,
    });
  }

  for (const dep of declared) {
    if (!resolvedMap.has(dep.name)) {
      entries.push({
        name: dep.name,
        resolvedVersion: '',
        declaredVersion: dep.version,
        status: 'missing',
      });
    }
  }

  return {
    entries,
    lockedCount: entries.filter((e) => e.status === 'locked').length,
    driftedCount: entries.filter((e) => e.status === 'drifted').length,
    missingCount: entries.filter((e) => e.status === 'missing').length,
    extraCount: entries.filter((e) => e.status === 'extra').length,
  };
}

export function formatShrinkwrapReport(analysis: ShrinkwrapAnalysis): string {
  const lines: string[] = ['Shrinkwrap Analysis', '==================='];
  lines.push(`Locked:  ${analysis.lockedCount}`);
  lines.push(`Drifted: ${analysis.driftedCount}`);
  lines.push(`Missing: ${analysis.missingCount}`);
  lines.push(`Extra:   ${analysis.extraCount}`);

  const issues = analysis.entries.filter((e) => e.status !== 'locked');
  if (issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    for (const entry of issues) {
      lines.push(
        `  [${entry.status.toUpperCase()}] ${entry.name} declared=${entry.declaredVersion || 'n/a'} resolved=${entry.resolvedVersion || 'n/a'}`
      );
    }
  }

  return lines.join('\n');
}
