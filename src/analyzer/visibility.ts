export type VisibilityStatus = 'public' | 'private' | 'restricted' | 'unknown';

export interface VisibilityEntry {
  name: string;
  version: string;
  status: VisibilityStatus;
  registry?: string;
  scope?: string;
}

export interface VisibilityReport {
  entries: VisibilityEntry[];
  summary: Record<VisibilityStatus, number>;
}

export function detectVisibility(
  name: string,
  version: string,
  resolved?: string
): VisibilityStatus {
  if (!resolved) return 'unknown';
  if (resolved.includes('registry.npmjs.org')) return 'public';
  if (
    resolved.includes('npm.pkg.github.com') ||
    resolved.includes('gitlab.com') ||
    resolved.includes('artifactory') ||
    resolved.includes('nexus')
  ) {
    return 'restricted';
  }
  if (
    resolved.startsWith('file:') ||
    resolved.startsWith('link:') ||
    resolved.startsWith('git+')
  ) {
    return 'private';
  }
  return 'unknown';
}

export function extractScope(name: string): string | undefined {
  return name.startsWith('@') ? name.split('/')[0] : undefined;
}

export function analyzeVisibility(
  packages: Record<string, { version: string; resolved?: string }>
): VisibilityReport {
  const entries: VisibilityEntry[] = [];
  const summary: Record<VisibilityStatus, number> = {
    public: 0,
    private: 0,
    restricted: 0,
    unknown: 0,
  };

  for (const [name, info] of Object.entries(packages)) {
    const status = detectVisibility(name, info.version, info.resolved);
    const scope = extractScope(name);
    const registry = info.resolved
      ? new URL(info.resolved.split('?')[0]).hostname
      : undefined;
    entries.push({ name, version: info.version, status, registry, scope });
    summary[status]++;
  }

  return { entries, summary };
}

export function formatVisibilityReport(report: VisibilityReport): string {
  const lines: string[] = ['## Visibility Report', ''];
  const { summary } = report;
  lines.push(
    `Public: ${summary.public} | Private: ${summary.private} | Restricted: ${summary.restricted} | Unknown: ${summary.unknown}`,
    ''
  );
  for (const entry of report.entries.filter((e) => e.status !== 'public')) {
    lines.push(`  [${entry.status.toUpperCase()}] ${entry.name}@${entry.version}${
      entry.registry ? ` (${entry.registry})` : ''
    }`);
  }
  return lines.join('\n');
}
