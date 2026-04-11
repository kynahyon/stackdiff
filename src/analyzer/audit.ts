import { DependencyChange } from '../diff/compare';

export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info';

export interface AuditVulnerability {
  package: string;
  severity: Severity;
  description: string;
  fixedIn?: string;
}

export interface AuditResult {
  package: string;
  from: string;
  to: string;
  vulnerabilities: AuditVulnerability[];
  highestSeverity: Severity | null;
}

export interface AuditSummary {
  results: AuditResult[];
  totalVulnerabilities: number;
  bySeverity: Record<Severity, number>;
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'moderate', 'low', 'info'];

export function rankSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b);
}

export function getHighestSeverity(vulns: AuditVulnerability[]): Severity | null {
  if (vulns.length === 0) return null;
  return vulns.reduce<Severity>((highest, v) => {
    return rankSeverity(v.severity, highest) < 0 ? v.severity : highest;
  }, 'info');
}

export function auditChanges(
  changes: DependencyChange[],
  knownVulnerabilities: AuditVulnerability[]
): AuditSummary {
  const results: AuditResult[] = [];
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
  };

  for (const change of changes) {
    if (change.type === 'removed') continue;
    const pkg = change.name;
    const to = change.to ?? '';
    const from = change.from ?? '';
    const vulns = knownVulnerabilities.filter((v) => v.package === pkg);
    const highestSeverity = getHighestSeverity(vulns);

    for (const v of vulns) {
      bySeverity[v.severity] = (bySeverity[v.severity] ?? 0) + 1;
    }

    if (vulns.length > 0) {
      results.push({ package: pkg, from, to, vulnerabilities: vulns, highestSeverity });
    }
  }

  const totalVulnerabilities = Object.values(bySeverity).reduce((a, b) => a + b, 0);
  return { results, totalVulnerabilities, bySeverity };
}

export function formatAuditReport(summary: AuditSummary): string {
  if (summary.totalVulnerabilities === 0) {
    return '✅ No vulnerabilities found in changed dependencies.\n';
  }

  const lines: string[] = ['🔍 Audit Report\n'];
  for (const result of summary.results) {
    lines.push(`  📦 ${result.package} (${result.from} → ${result.to})`);
    for (const v of result.vulnerabilities) {
      lines.push(`     [${v.severity.toUpperCase()}] ${v.description}${v.fixedIn ? ` (fixed in ${v.fixedIn})` : ''}`);
    }
  }
  lines.push('');
  lines.push(`Total: ${summary.totalVulnerabilities} vulnerability(ies)`);
  SEVERITY_ORDER.forEach((s) => {
    if (summary.bySeverity[s] > 0) {
      lines.push(`  ${s}: ${summary.bySeverity[s]}`);
    }
  });
  return lines.join('\n') + '\n';
}
