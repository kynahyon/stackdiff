import { DiffResult } from '../diff/compare';

export interface ChangelogEntry {
  package: string;
  from: string;
  to: string;
  type: 'major' | 'minor' | 'patch' | 'added' | 'removed';
  breaking: boolean;
}

export interface ChangelogReport {
  entries: ChangelogEntry[];
  totalBreaking: number;
  summary: string;
}

export function buildChangelogEntry(
  pkg: string,
  from: string | undefined,
  to: string | undefined,
  type: ChangelogEntry['type']
): ChangelogEntry {
  const breaking = type === 'major' || type === 'removed';
  return {
    package: pkg,
    from: from ?? 'N/A',
    to: to ?? 'N/A',
    type,
    breaking,
  };
}

/**
 * Determines the semver change type between two version strings.
 * Returns 'major' if the major version increased, 'minor' if the minor
 * version increased, or 'patch' otherwise.
 */
function classifyVersionChange(
  from: string,
  to: string
): 'major' | 'minor' | 'patch' {
  const [fromMajor, fromMinor] = from.split('.').map(Number);
  const [toMajor, toMinor] = to.split('.').map(Number);

  if (toMajor > fromMajor) return 'major';
  if (toMinor > fromMinor) return 'minor';
  return 'patch';
}

export function generateChangelog(diff: DiffResult): ChangelogReport {
  const entries: ChangelogEntry[] = [];

  for (const pkg of diff.added) {
    entries.push(buildChangelogEntry(pkg.name, undefined, pkg.version, 'added'));
  }

  for (const pkg of diff.removed) {
    entries.push(buildChangelogEntry(pkg.name, pkg.version, undefined, 'removed'));
  }

  for (const change of diff.updated) {
    const type = classifyVersionChange(change.from, change.to);
    entries.push(buildChangelogEntry(change.name, change.from, change.to, type));
  }

  const totalBreaking = entries.filter((e) => e.breaking).length;
  const summary = `${entries.length} change(s) detected, ${totalBreaking} breaking.`;

  return { entries, totalBreaking, summary };
}

export function formatChangelog(report: ChangelogReport): string {
  const lines: string[] = ['# Dependency Changelog', ''];

  if (report.entries.length === 0) {
    lines.push('No changes detected.');
    return lines.join('\n');
  }

  lines.push(`**${report.summary}**`, '');

  for (const entry of report.entries) {
    const breaking = entry.breaking ? ' ⚠️ BREAKING' : '';
    lines.push(
      `- **${entry.package}** [${entry.type}]${breaking}: ${entry.from} → ${entry.to}`
    );
  }

  return lines.join('\n');
}
