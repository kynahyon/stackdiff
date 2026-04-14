/**
 * Analyzes how dependencies are resolved across lockfile entries,
 * detecting version conflicts and resolution overrides.
 */

export interface ResolvedPackage {
  name: string;
  requestedVersion: string;
  resolvedVersion: string;
  isOverride: boolean;
}

export interface ResolutionConflict {
  name: string;
  requestedVersions: string[];
  resolvedVersion: string;
  conflictLevel: 'patch' | 'minor' | 'major';
}

export interface ResolutionReport {
  total: number;
  overrides: ResolvedPackage[];
  conflicts: ResolutionConflict[];
}

export function detectResolutionConflicts(
  packages: Record<string, string[]>
): ResolutionConflict[] {
  const conflicts: ResolutionConflict[] = [];

  for (const [name, versions] of Object.entries(packages)) {
    const unique = [...new Set(versions)];
    if (unique.length <= 1) continue;

    const resolved = unique[unique.length - 1];
    const level = classifyConflictLevel(unique);

    conflicts.push({
      name,
      requestedVersions: unique,
      resolvedVersion: resolved,
      conflictLevel: level,
    });
  }

  return conflicts;
}

export function classifyConflictLevel(
  versions: string[]
): 'patch' | 'minor' | 'major' {
  const majors = new Set(versions.map((v) => v.split('.')[0]));
  if (majors.size > 1) return 'major';
  const minors = new Set(versions.map((v) => v.split('.').slice(0, 2).join('.')));
  if (minors.size > 1) return 'minor';
  return 'patch';
}

export function analyzeResolutions(
  dependencies: Record<string, string>,
  resolutions: Record<string, string>
): ResolutionReport {
  const grouped: Record<string, string[]> = {};

  for (const [name, version] of Object.entries(dependencies)) {
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(version);
  }

  const conflicts = detectResolutionConflicts(grouped);

  const overrides: ResolvedPackage[] = Object.entries(resolutions).map(
    ([name, resolvedVersion]) => ({
      name,
      requestedVersion: dependencies[name] ?? '*',
      resolvedVersion,
      isOverride: true,
    })
  );

  return {
    total: Object.keys(dependencies).length,
    overrides,
    conflicts,
  };
}

export function formatResolutionReport(report: ResolutionReport): string {
  const lines: string[] = [];
  lines.push(`Resolution Analysis (${report.total} packages)`);
  lines.push('');

  if (report.conflicts.length === 0) {
    lines.push('✅ No version conflicts detected.');
  } else {
    lines.push(`⚠️  Conflicts (${report.conflicts.length}):`);
    for (const c of report.conflicts) {
      lines.push(
        `  [${c.conflictLevel.toUpperCase()}] ${c.name}: ${c.requestedVersions.join(', ')} → resolved as ${c.resolvedVersion}`
      );
    }
  }

  lines.push('');
  if (report.overrides.length === 0) {
    lines.push('No resolution overrides found.');
  } else {
    lines.push(`🔧 Overrides (${report.overrides.length}):`);
    for (const o of report.overrides) {
      lines.push(`  ${o.name}: forced to ${o.resolvedVersion}`);
    }
  }

  return lines.join('\n');
}
