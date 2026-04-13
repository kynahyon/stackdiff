export interface MaintainerInfo {
  name: string;
  version: string;
  maintainerCount: number | null;
  lastPublished: string | null;
  isAbandoned: boolean;
  abandonedReason?: string;
}

export interface MaintainerAnalysis {
  packages: MaintainerInfo[];
  abandonedCount: number;
  singleMaintainerCount: number;
  unknownCount: number;
}

export type AbandonedThresholdDays = number;

const DEFAULT_ABANDONED_DAYS = 730; // 2 years

export function isAbandoned(
  lastPublished: string | null,
  thresholdDays: AbandonedThresholdDays = DEFAULT_ABANDONED_DAYS
): boolean {
  if (!lastPublished) return false;
  const last = new Date(lastPublished).getTime();
  const now = Date.now();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

export function classifyMaintainerRisk(
  info: MaintainerInfo
): 'high' | 'medium' | 'low' | 'unknown' {
  if (info.maintainerCount === null) return 'unknown';
  if (info.isAbandoned) return 'high';
  if (info.maintainerCount === 1) return 'medium';
  return 'low';
}

export function analyzeMaintainers(
  packages: Record<string, string>,
  metaMap: Record<string, { maintainerCount: number | null; lastPublished: string | null }>,
  thresholdDays: AbandonedThresholdDays = DEFAULT_ABANDONED_DAYS
): MaintainerAnalysis {
  const results: MaintainerInfo[] = Object.entries(packages).map(([name, version]) => {
    const meta = metaMap[name] ?? { maintainerCount: null, lastPublished: null };
    const abandoned = isAbandoned(meta.lastPublished, thresholdDays);
    return {
      name,
      version,
      maintainerCount: meta.maintainerCount,
      lastPublished: meta.lastPublished,
      isAbandoned: abandoned,
      abandonedReason: abandoned ? `No publish in ${thresholdDays} days` : undefined,
    };
  });

  return {
    packages: results,
    abandonedCount: results.filter((p) => p.isAbandoned).length,
    singleMaintainerCount: results.filter((p) => p.maintainerCount === 1).length,
    unknownCount: results.filter((p) => p.maintainerCount === null).length,
  };
}

export function formatMaintainerReport(analysis: MaintainerAnalysis): string {
  const lines: string[] = ['## Maintainer Analysis', ''];
  lines.push(
    `Abandoned: ${analysis.abandonedCount} | Single maintainer: ${analysis.singleMaintainerCount} | Unknown: ${analysis.unknownCount}`,
    ''
  );
  for (const pkg of analysis.packages) {
    const risk = classifyMaintainerRisk(pkg);
    const maintainers = pkg.maintainerCount !== null ? pkg.maintainerCount : '?';
    const published = pkg.lastPublished ?? 'unknown';
    lines.push(
      `  [${risk.toUpperCase()}] ${pkg.name}@${pkg.version} — maintainers: ${maintainers}, last published: ${published}`
    );
  }
  return lines.join('\n');
}
