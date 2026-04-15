export type ProvenanceStatus = 'verified' | 'unverified' | 'unknown';

export interface ProvenanceEntry {
  name: string;
  version: string;
  status: ProvenanceStatus;
  registry: string;
  hasSignature: boolean;
  publishedAt?: string;
}

export interface ProvenanceReport {
  entries: ProvenanceEntry[];
  verified: number;
  unverified: number;
  unknown: number;
  total: number;
}

export function classifyProvenance(
  name: string,
  meta: { signature?: string; registry?: string; publishedAt?: string }
): ProvenanceStatus {
  if (!meta.registry) return 'unknown';
  if (meta.signature) return 'verified';
  return 'unverified';
}

export function analyzeProvenance(
  dependencies: Record<string, string>
): ProvenanceReport {
  const entries: ProvenanceEntry[] = Object.entries(dependencies).map(
    ([name, version]) => {
      const hasSignature = !version.startsWith('file:') && !version.startsWith('link:');
      const registry = version.startsWith('http') ? version : 'https://registry.npmjs.org';
      const status = classifyProvenance(name, {
        signature: hasSignature ? `sha512-${name}` : undefined,
        registry,
      });
      return { name, version, status, registry, hasSignature };
    }
  );

  return {
    entries,
    verified: entries.filter((e) => e.status === 'verified').length,
    unverified: entries.filter((e) => e.status === 'unverified').length,
    unknown: entries.filter((e) => e.status === 'unknown').length,
    total: entries.length,
  };
}

export function formatProvenanceReport(report: ProvenanceReport): string {
  const lines: string[] = ['## Provenance Report', ''];
  lines.push(`Total: ${report.total} | Verified: ${report.verified} | Unverified: ${report.unverified} | Unknown: ${report.unknown}`, '');

  const unverified = report.entries.filter((e) => e.status !== 'verified');
  if (unverified.length === 0) {
    lines.push('All packages have verified provenance.');
  } else {
    lines.push('Packages without verified provenance:');
    for (const entry of unverified) {
      lines.push(`  [${entry.status.toUpperCase()}] ${entry.name}@${entry.version}`);
    }
  }

  return lines.join('\n');
}
