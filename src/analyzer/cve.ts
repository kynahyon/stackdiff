import { Dependency } from '../parser';

export type CveSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface CveEntry {
  name: string;
  version: string;
  cveId: string;
  severity: CveSeverity;
  description: string;
}

export interface CveAnalysis {
  entries: CveEntry[];
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

const KNOWN_CVE_PATTERNS: Array<{ pattern: RegExp; severity: CveSeverity; cveId: string; description: string }> = [
  { pattern: /^lodash$/, severity: 'high', cveId: 'CVE-2021-23337', description: 'Prototype pollution via zipObjectDeep' },
  { pattern: /^axios$/, severity: 'medium', cveId: 'CVE-2023-45857', description: 'Cross-site request forgery via XSRF token' },
  { pattern: /^minimist$/, severity: 'critical', cveId: 'CVE-2021-44906', description: 'Prototype pollution in minimist' },
  { pattern: /^node-fetch$/, severity: 'high', cveId: 'CVE-2022-0235', description: 'Exposure of sensitive information to unauthorized actor' },
  { pattern: /^semver$/, severity: 'medium', cveId: 'CVE-2022-25883', description: 'Regular expression denial of service' },
];

export function rankCveSeverity(severity: CveSeverity): number {
  const rank: Record<CveSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  return rank[severity];
}

export function analyzeCve(deps: Dependency[]): CveAnalysis {
  const entries: CveEntry[] = [];

  for (const dep of deps) {
    for (const pat of KNOWN_CVE_PATTERNS) {
      if (pat.pattern.test(dep.name)) {
        entries.push({
          name: dep.name,
          version: dep.version,
          cveId: pat.cveId,
          severity: pat.severity,
          description: pat.description,
        });
      }
    }
  }

  return {
    entries,
    critical: entries.filter(e => e.severity === 'critical').length,
    high: entries.filter(e => e.severity === 'high').length,
    medium: entries.filter(e => e.severity === 'medium').length,
    low: entries.filter(e => e.severity === 'low').length,
    total: entries.length,
  };
}

export function formatCveReport(analysis: CveAnalysis): string {
  if (analysis.total === 0) {
    return 'CVE Analysis: No known CVEs detected.\n';
  }

  const lines: string[] = ['CVE Analysis', '============'];
  const sorted = [...analysis.entries].sort((a, b) => rankCveSeverity(b.severity) - rankCveSeverity(a.severity));

  for (const entry of sorted) {
    lines.push(`[${entry.severity.toUpperCase()}] ${entry.name}@${entry.version} — ${entry.cveId}: ${entry.description}`);
  }

  lines.push('');
  lines.push(`Summary: ${analysis.critical} critical, ${analysis.high} high, ${analysis.medium} medium, ${analysis.low} low`);
  return lines.join('\n') + '\n';
}
