import { parseVersion } from './impact';

export type ConstraintType = 'exact' | 'patch' | 'minor' | 'major' | 'range' | 'unknown';

export interface SemverConstraint {
  raw: string;
  type: ConstraintType;
  major: number;
  minor: number;
  patch: number;
}

export function parseConstraint(version: string): SemverConstraint {
  const raw = version.trim();

  // Exact version: 1.2.3
  if (/^\d+\.\d+\.\d+$/.test(raw)) {
    const parsed = parseVersion(raw);
    return { raw, type: 'exact', ...parsed };
  }

  // Patch range: ~1.2.3
  if (/^~\d+\.\d+\.\d+$/.test(raw)) {
    const parsed = parseVersion(raw.slice(1));
    return { raw, type: 'patch', ...parsed };
  }

  // Minor range: ^1.2.3
  if (/^\^\d+\.\d+\.\d+$/.test(raw)) {
    const parsed = parseVersion(raw.slice(1));
    return { raw, type: 'minor', ...parsed };
  }

  // Major wildcard: * or x
  if (raw === '*' || raw === 'x') {
    return { raw, type: 'major', major: 0, minor: 0, patch: 0 };
  }

  // Range expression: >=1.0.0 <2.0.0
  if (raw.includes(' ') || raw.includes('>=') || raw.includes('<=')) {
    return { raw, type: 'range', major: 0, minor: 0, patch: 0 };
  }

  return { raw, type: 'unknown', major: 0, minor: 0, patch: 0 };
}

export function isCompatible(constraint: SemverConstraint, version: string): boolean {
  const v = parseVersion(version);
  switch (constraint.type) {
    case 'exact':
      return v.major === constraint.major && v.minor === constraint.minor && v.patch === constraint.patch;
    case 'patch':
      return v.major === constraint.major && v.minor === constraint.minor && v.patch >= constraint.patch;
    case 'minor':
      return v.major === constraint.major && (v.minor > constraint.minor || (v.minor === constraint.minor && v.patch >= constraint.patch));
    case 'major':
      return true;
    default:
      return false;
  }
}

export function constraintSummary(constraints: SemverConstraint[]): Record<ConstraintType, number> {
  const summary: Record<ConstraintType, number> = { exact: 0, patch: 0, minor: 0, major: 0, range: 0, unknown: 0 };
  for (const c of constraints) {
    summary[c.type]++;
  }
  return summary;
}
