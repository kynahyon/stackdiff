import { DependencyMap } from '../parser';

export interface DuplicateEntry {
  name: string;
  versions: string[];
  count: number;
}

export interface DuplicatesReport {
  duplicates: DuplicateEntry[];
  totalDuplicates: number;
  affectedPackages: number;
}

/**
 * Find packages that appear with multiple versions in a lockfile.
 */
export function findDuplicates(dependencies: DependencyMap): DuplicateEntry[] {
  const versionMap: Record<string, Set<string>> = {};

  for (const [name, version] of Object.entries(dependencies)) {
    // Strip scope/path suffixes like "lodash@4.17.21" keys
    const baseName = name.split('@').slice(0, name.startsWith('@') ? 2 : 1).join('@');
    if (!versionMap[baseName]) {
      versionMap[baseName] = new Set();
    }
    versionMap[baseName].add(version);
  }

  return Object.entries(versionMap)
    .filter(([, versions]) => versions.size > 1)
    .map(([name, versions]) => ({
      name,
      versions: Array.from(versions).sort(),
      count: versions.size,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Analyze duplicates and return a structured report.
 */
export function analyzeDuplicates(dependencies: DependencyMap): DuplicatesReport {
  const duplicates = findDuplicates(dependencies);
  return {
    duplicates,
    totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0),
    affectedPackages: duplicates.length,
  };
}

/**
 * Format a duplicates report as a human-readable string.
 */
export function formatDuplicatesReport(report: DuplicatesReport): string {
  if (report.affectedPackages === 0) {
    return 'No duplicate packages found.';
  }

  const lines: string[] = [
    `Found ${report.totalDuplicates} duplicate version(s) across ${report.affectedPackages} package(s):`,
    '',
  ];

  for (const entry of report.duplicates) {
    lines.push(`  ${entry.name} (${entry.count} versions): ${entry.versions.join(', ')}`);
  }

  return lines.join('\n');
}
