export interface FreshnessEntry {
  name: string;
  current: string;
  publishedAt?: string;
  daysSincePublish?: number;
  freshnessStatus: 'fresh' | 'aging' | 'stale' | 'unknown';
}

export interface FreshnessReport {
  entries: FreshnessEntry[];
  fresh: number;
  aging: number;
  stale: number;
  unknown: number;
}

const FRESH_DAYS = 180;
const STALE_DAYS = 730;

export function classifyFreshness(
  daysSincePublish: number | undefined
): FreshnessEntry['freshnessStatus'] {
  if (daysSincePublish === undefined) return 'unknown';
  if (daysSincePublish <= FRESH_DAYS) return 'fresh';
  if (daysSincePublish <= STALE_DAYS) return 'aging';
  return 'stale';
}

export function daysSince(dateStr: string): number {
  const published = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function analyzeFreshness(
  packages: Array<{ name: string; version: string; publishedAt?: string }>
): FreshnessReport {
  const entries: FreshnessEntry[] = packages.map((pkg) => {
    const days = pkg.publishedAt ? daysSince(pkg.publishedAt) : undefined;
    const status = classifyFreshness(days);
    return {
      name: pkg.name,
      current: pkg.version,
      publishedAt: pkg.publishedAt,
      daysSincePublish: days,
      freshnessStatus: status,
    };
  });

  return {
    entries,
    fresh: entries.filter((e) => e.freshnessStatus === 'fresh').length,
    aging: entries.filter((e) => e.freshnessStatus === 'aging').length,
    stale: entries.filter((e) => e.freshnessStatus === 'stale').length,
    unknown: entries.filter((e) => e.freshnessStatus === 'unknown').length,
  };
}

export function formatFreshnessReport(report: FreshnessReport): string {
  const lines: string[] = ['## Freshness Report', ''];
  lines.push(
    `Fresh: ${report.fresh}  Aging: ${report.aging}  Stale: ${report.stale}  Unknown: ${report.unknown}`,
    ''
  );
  for (const entry of report.entries) {
    const age =
      entry.daysSincePublish !== undefined
        ? `${entry.daysSincePublish}d ago`
        : 'unknown';
    lines.push(
      `  [${entry.freshnessStatus.toUpperCase().padEnd(7)}] ${entry.name}@${entry.current} (${age})`
    );
  }
  return lines.join('\n');
}
