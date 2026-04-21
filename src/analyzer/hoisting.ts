import { Dependency } from '../parser';

export type HoistStatus = 'hoisted' | 'nested' | 'conflicted';

export interface HoistEntry {
  name: string;
  resolvedVersion: string;
  status: HoistStatus;
  requiredBy: string[];
  nestedVersions: string[];
}

export interface HoistReport {
  entries: HoistEntry[];
  hoistedCount: number;
  nestedCount: number;
  conflictedCount: number;
}

export function classifyHoistStatus(
  requiredBy: string[],
  nestedVersions: string[]
): HoistStatus {
  if (nestedVersions.length > 0) return 'conflicted';
  if (requiredBy.length > 1) return 'hoisted';
  return 'nested';
}

export function analyzeHoisting(deps: Dependency[]): HoistReport {
  const nameMap = new Map<string, { versions: Set<string>; requiredBy: string[] }>();

  for (const dep of deps) {
    const existing = nameMap.get(dep.name);
    if (existing) {
      existing.versions.add(dep.version);
      if (dep.requiredBy) existing.requiredBy.push(...dep.requiredBy);
    } else {
      nameMap.set(dep.name, {
        versions: new Set([dep.version]),
        requiredBy: dep.requiredBy ? [...dep.requiredBy] : [],
      });
    }
  }

  const entries: HoistEntry[] = [];

  for (const [name, { versions, requiredBy }] of nameMap.entries()) {
    const versionList = Array.from(versions);
    const resolvedVersion = versionList[0];
    const nestedVersions = versionList.slice(1);
    const status = classifyHoistStatus(requiredBy, nestedVersions);
    entries.push({ name, resolvedVersion, status, requiredBy, nestedVersions });
  }

  return {
    entries,
    hoistedCount: entries.filter(e => e.status === 'hoisted').length,
    nestedCount: entries.filter(e => e.status === 'nested').length,
    conflictedCount: entries.filter(e => e.status === 'conflicted').length,
  };
}

export function formatHoistReport(report: HoistReport): string {
  const lines: string[] = [
    `Hoisting Analysis`,
    `  Hoisted:    ${report.hoistedCount}`,
    `  Nested:     ${report.nestedCount}`,
    `  Conflicted: ${report.conflictedCount}`,
    '',
  ];

  const conflicted = report.entries.filter(e => e.status === 'conflicted');
  if (conflicted.length > 0) {
    lines.push('Conflicts:');
    for (const e of conflicted) {
      lines.push(`  ${e.name}@${e.resolvedVersion} (also: ${e.nestedVersions.join(', ')})`);
    }
  }

  return lines.join('\n');
}
