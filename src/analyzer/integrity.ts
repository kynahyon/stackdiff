import { Dependency } from '../parser';

export type IntegrityStatus = 'valid' | 'missing' | 'malformed' | 'weak';

export interface IntegrityEntry {
  name: string;
  version: string;
  integrity: string | undefined;
  status: IntegrityStatus;
  algorithm: string | undefined;
}

export interface IntegrityReport {
  entries: IntegrityEntry[];
  missing: number;
  malformed: number;
  weak: number;
  valid: number;
}

const STRONG_ALGORITHMS = ['sha512'];
const WEAK_ALGORITHMS = ['sha1', 'md5'];

export function detectAlgorithm(integrity: string): string | undefined {
  const match = integrity.match(/^([a-zA-Z0-9]+)-/);
  return match ? match[1].toLowerCase() : undefined;
}

export function classifyIntegrity(integrity: string | undefined): IntegrityStatus {
  if (!integrity) return 'missing';
  if (!/^[a-zA-Z0-9]+-[A-Za-z0-9+/=]+$/.test(integrity)) return 'malformed';
  const algo = detectAlgorithm(integrity);
  if (!algo) return 'malformed';
  if (WEAK_ALGORITHMS.includes(algo)) return 'weak';
  if (STRONG_ALGORITHMS.includes(algo)) return 'valid';
  return 'valid';
}

export function analyzeIntegrity(deps: Dependency[]): IntegrityReport {
  const entries: IntegrityEntry[] = deps.map((dep) => {
    const integrity = (dep as any).integrity as string | undefined;
    const status = classifyIntegrity(integrity);
    const algorithm = integrity ? detectAlgorithm(integrity) : undefined;
    return { name: dep.name, version: dep.version, integrity, status, algorithm };
  });

  return {
    entries,
    missing: entries.filter((e) => e.status === 'missing').length,
    malformed: entries.filter((e) => e.status === 'malformed').length,
    weak: entries.filter((e) => e.status === 'weak').length,
    valid: entries.filter((e) => e.status === 'valid').length,
  };
}

export function formatIntegrityReport(report: IntegrityReport): string {
  const lines: string[] = ['## Integrity Report', ''];
  lines.push(`Valid: ${report.valid} | Weak: ${report.weak} | Malformed: ${report.malformed} | Missing: ${report.missing}`, '');

  const issues = report.entries.filter((e) => e.status !== 'valid');
  if (issues.length === 0) {
    lines.push('All packages have strong integrity hashes.');
    return lines.join('\n');
  }

  lines.push('| Package | Version | Status | Algorithm |');
  lines.push('|---------|---------|--------|-----------|');
  for (const e of issues) {
    lines.push(`| ${e.name} | ${e.version} | ${e.status} | ${e.algorithm ?? 'n/a'} |`);
  }
  return lines.join('\n');
}
