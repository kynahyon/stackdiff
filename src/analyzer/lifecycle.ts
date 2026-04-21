import { Dependency } from '../parser';

export type LifecycleRisk = 'none' | 'low' | 'medium' | 'high';

export interface LifecycleEntry {
  name: string;
  version: string;
  scripts: string[];
  risk: LifecycleRisk;
  reason: string;
}

export interface LifecycleReport {
  entries: LifecycleEntry[];
  totalWithHooks: number;
  highRiskCount: number;
}

const DANGEROUS_SCRIPTS = ['preinstall', 'install', 'postinstall', 'preuninstall', 'uninstall', 'postuninstall'];
const HIGH_RISK_SCRIPTS = ['preinstall', 'install', 'postinstall'];

export function classifyLifecycleRisk(scripts: string[]): LifecycleRisk {
  if (scripts.length === 0) return 'none';
  if (scripts.some(s => HIGH_RISK_SCRIPTS.includes(s))) return 'high';
  if (scripts.some(s => DANGEROUS_SCRIPTS.includes(s))) return 'medium';
  return 'low';
}

export function extractLifecycleScripts(scripts: Record<string, string> | undefined): string[] {
  if (!scripts) return [];
  return Object.keys(scripts).filter(k => DANGEROUS_SCRIPTS.includes(k));
}

export function analyzeLifecycle(deps: Dependency[]): LifecycleReport {
  const entries: LifecycleEntry[] = [];

  for (const dep of deps) {
    const scripts = extractLifecycleScripts((dep as any).scripts);
    if (scripts.length === 0) continue;
    const risk = classifyLifecycleRisk(scripts);
    entries.push({
      name: dep.name,
      version: dep.version,
      scripts,
      risk,
      reason: `Has lifecycle hooks: ${scripts.join(', ')}`,
    });
  }

  entries.sort((a, b) => {
    const order: Record<LifecycleRisk, number> = { high: 0, medium: 1, low: 2, none: 3 };
    return order[a.risk] - order[b.risk];
  });

  return {
    entries,
    totalWithHooks: entries.length,
    highRiskCount: entries.filter(e => e.risk === 'high').length,
  };
}

export function formatLifecycleReport(report: LifecycleReport): string {
  if (report.entries.length === 0) {
    return 'No packages with lifecycle hooks found.';
  }
  const lines: string[] = [
    `Lifecycle Hook Analysis`,
    `Packages with hooks: ${report.totalWithHooks} (${report.highRiskCount} high risk)`,
    '',
  ];
  for (const e of report.entries) {
    lines.push(`[${e.risk.toUpperCase()}] ${e.name}@${e.version}`);
    lines.push(`  Scripts: ${e.scripts.join(', ')}`);
    lines.push(`  ${e.reason}`);
  }
  return lines.join('\n');
}
