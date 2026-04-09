import { DependencyChange } from '../diff/compare';

export type LicenseRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface LicenseEntry {
  name: string;
  from: string | null;
  to: string | null;
  license: string | null;
  risk: LicenseRisk;
}

export interface LicenseReport {
  entries: LicenseEntry[];
  riskCounts: Record<LicenseRisk, number>;
  hasHighRisk: boolean;
}

const COPYLEFT_LICENSES = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'];
const PERMISSIVE_LICENSES = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD'];

export function classifyLicenseRisk(license: string | null): LicenseRisk {
  if (!license) return 'unknown';
  const upper = license.toUpperCase();
  if (COPYLEFT_LICENSES.some(l => upper.includes(l.toUpperCase()))) return 'high';
  if (PERMISSIVE_LICENSES.some(l => upper.includes(l.toUpperCase()))) return 'low';
  return 'medium';
}

export function extractLicense(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  if (typeof meta['license'] === 'string') return meta['license'];
  return null;
}

export function analyzeLicenses(
  changes: DependencyChange[],
  metaMap: Record<string, Record<string, unknown>> = {}
): LicenseReport {
  const entries: LicenseEntry[] = changes
    .filter(c => c.type === 'added' || c.type === 'changed')
    .map(c => {
      const license = extractLicense(metaMap[c.name]) ?? null;
      const risk = classifyLicenseRisk(license);
      return {
        name: c.name,
        from: c.from ?? null,
        to: c.to ?? null,
        license,
        risk,
      };
    });

  const riskCounts: Record<LicenseRisk, number> = { low: 0, medium: 0, high: 0, unknown: 0 };
  for (const entry of entries) {
    riskCounts[entry.risk]++;
  }

  return {
    entries,
    riskCounts,
    hasHighRisk: riskCounts.high > 0,
  };
}

export function formatLicenseReport(report: LicenseReport): string {
  const lines: string[] = ['## License Report\n'];
  if (report.entries.length === 0) {
    lines.push('No new or changed dependencies to analyze.\n');
    return lines.join('\n');
  }
  lines.push(`Risk summary: high=${report.riskCounts.high}, medium=${report.riskCounts.medium}, low=${report.riskCounts.low}, unknown=${report.riskCounts.unknown}\n`);
  for (const e of report.entries) {
    lines.push(`  [${e.risk.toUpperCase()}] ${e.name}@${e.to ?? '?'} — license: ${e.license ?? 'unknown'}`);
  }
  return lines.join('\n');
}
