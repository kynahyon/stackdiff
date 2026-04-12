/**
 * Analyzes whether dependencies are pinned to exact versions
 * or use loose version ranges.
 */

export type PinStatus = 'exact' | 'range' | 'wildcard' | 'unknown';

export interface PinnedEntry {
  name: string;
  version: string;
  status: PinStatus;
  recommendation?: string;
}

export interface PinnedReport {
  total: number;
  exact: number;
  range: number;
  wildcard: number;
  entries: PinnedEntry[];
}

export function classifyPinStatus(version: string): PinStatus {
  if (!version || version === '*' || version === 'latest') return 'wildcard';
  if (/^[\^~]/.test(version)) return 'range';
  if (/^\d+\.\d+\.\d+/.test(version)) return 'exact';
  return 'unknown';
}

export function analyzePinned(
  dependencies: Record<string, string>
): PinnedReport {
  const entries: PinnedEntry[] = Object.entries(dependencies).map(
    ([name, version]) => {
      const status = classifyPinStatus(version);
      let recommendation: string | undefined;
      if (status === 'wildcard') {
        recommendation = `Pin to a specific version to avoid unexpected updates`;
      } else if (status === 'range') {
        recommendation = `Consider pinning to exact version for reproducible builds`;
      }
      return { name, version, status, recommendation };
    }
  );

  return {
    total: entries.length,
    exact: entries.filter((e) => e.status === 'exact').length,
    range: entries.filter((e) => e.status === 'range').length,
    wildcard: entries.filter((e) => e.status === 'wildcard').length,
    entries,
  };
}

export function formatPinnedReport(report: PinnedReport): string {
  const lines: string[] = [
    `Pinned Dependency Analysis`,
    `==========================`,
    `Total: ${report.total} | Exact: ${report.exact} | Range: ${report.range} | Wildcard: ${report.wildcard}`,
    '',
  ];

  const unpinned = report.entries.filter((e) => e.status !== 'exact');
  if (unpinned.length === 0) {
    lines.push('✅ All dependencies are pinned to exact versions.');
  } else {
    lines.push('⚠️  Unpinned dependencies:');
    for (const entry of unpinned) {
      lines.push(`  ${entry.name}@${entry.version} [${entry.status}]`);
      if (entry.recommendation) {
        lines.push(`    → ${entry.recommendation}`);
      }
    }
  }

  return lines.join('\n');
}
