export interface SizeEntry {
  name: string;
  oldSize: number | null;
  newSize: number | null;
  delta: number;
  deltaPercent: number | null;
}

export interface SizeReport {
  entries: SizeEntry[];
  totalOldSize: number;
  totalNewSize: number;
  totalDelta: number;
}

export function estimatePackageSize(version: string): number {
  // Deterministic pseudo-size based on version string for estimation
  let hash = 0;
  for (let i = 0; i < version.length; i++) {
    hash = (hash * 31 + version.charCodeAt(i)) >>> 0;
  }
  return 10000 + (hash % 490000);
}

export function analyzeSizes(
  oldDeps: Record<string, string>,
  newDeps: Record<string, string>
): SizeReport {
  const allNames = new Set([...Object.keys(oldDeps), ...Object.keys(newDeps)]);
  const entries: SizeEntry[] = [];

  for (const name of allNames) {
    const oldVersion = oldDeps[name] ?? null;
    const newVersion = newDeps[name] ?? null;

    const oldSize = oldVersion !== null ? estimatePackageSize(oldVersion) : null;
    const newSize = newVersion !== null ? estimatePackageSize(newVersion) : null;

    const delta = (newSize ?? 0) - (oldSize ?? 0);
    const deltaPercent =
      oldSize !== null && oldSize > 0 ? (delta / oldSize) * 100 : null;

    entries.push({ name, oldSize, newSize, delta, deltaPercent });
  }

  entries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const totalOldSize = entries.reduce((s, e) => s + (e.oldSize ?? 0), 0);
  const totalNewSize = entries.reduce((s, e) => s + (e.newSize ?? 0), 0);
  const totalDelta = totalNewSize - totalOldSize;

  return { entries, totalOldSize, totalNewSize, totalDelta };
}

/**
 * Returns only entries where the package was added, removed, or changed size.
 * Entries where both versions resolve to the same estimated size are excluded.
 */
export function filterChangedEntries(report: SizeReport): SizeEntry[] {
  return report.entries.filter((e) => e.delta !== 0);
}

export function formatSizeReport(report: SizeReport): string {
  const fmt = (bytes: number) =>
    bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} kB` : `${bytes} B`;

  const sign = (n: number) => (n >= 0 ? `+${fmt(n)}` : `-${fmt(Math.abs(n))}`);

  const lines: string[] = [
    'Size Impact Report',
    '==================',
  ];

  for (const e of report.entries) {
    const pct =
      e.deltaPercent !== null ? ` (${e.deltaPercent.toFixed(1)}%)` : '';
    lines.push(`  ${e.name}: ${sign(e.delta)}${pct}`);
  }

  lines.push('');
  lines.push(
    `Total: ${fmt(report.totalOldSize)} → ${fmt(report.totalNewSize)} (${sign(report.totalDelta)})`
  );

  return lines.join('\n');
}
