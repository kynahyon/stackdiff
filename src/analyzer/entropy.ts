/**
 * Analyzes version entropy — how "chaotic" or spread out the version landscape
 * is across a set of dependencies (e.g. many different major versions in use).
 */

import { Dependency } from '../parser';

export interface EntropyResult {
  name: string;
  versions: string[];
  uniqueMajors: number[];
  entropyScore: number; // 0.0 (stable) – 1.0 (chaotic)
  risk: 'low' | 'medium' | 'high';
}

export interface EntropyReport {
  entries: EntropyResult[];
  averageEntropy: number;
  highRiskCount: number;
}

export function getMajor(version: string): number {
  const match = version.replace(/^[^\d]*/, '').match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function calculateEntropy(versions: string[]): number {
  if (versions.length <= 1) return 0;
  const majors = versions.map(getMajor);
  const unique = new Set(majors).size;
  // Normalize: 1 unique = 0, all unique = 1
  return Math.min((unique - 1) / (versions.length - 1), 1);
}

export function classifyEntropyRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.6) return 'high';
  if (score >= 0.3) return 'medium';
  return 'low';
}

export function analyzeEntropy(dependencies: Dependency[]): EntropyReport {
  // Group by package name to find packages with multiple resolved versions
  const grouped = new Map<string, string[]>();
  for (const dep of dependencies) {
    const existing = grouped.get(dep.name) ?? [];
    existing.push(dep.version);
    grouped.set(dep.name, existing);
  }

  const entries: EntropyResult[] = [];
  for (const [name, versions] of grouped.entries()) {
    const uniqueMajors = [...new Set(versions.map(getMajor))].sort((a, b) => a - b);
    const entropyScore = calculateEntropy(versions);
    const risk = classifyEntropyRisk(entropyScore);
    entries.push({ name, versions, uniqueMajors, entropyScore, risk });
  }

  entries.sort((a, b) => b.entropyScore - a.entropyScore);

  const averageEntropy =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.entropyScore, 0) / entries.length
      : 0;

  const highRiskCount = entries.filter((e) => e.risk === 'high').length;

  return { entries, averageEntropy, highRiskCount };
}

export function formatEntropyReport(report: EntropyReport): string {
  const lines: string[] = ['## Version Entropy Report', ''];
  lines.push(`Average entropy: ${report.averageEntropy.toFixed(2)}  High-risk packages: ${report.highRiskCount}`, '');

  if (report.entries.length === 0) {
    lines.push('No dependencies found.');
    return lines.join('\n');
  }

  for (const e of report.entries) {
    if (e.risk === 'low') continue;
    const badge = e.risk === 'high' ? '🔴' : '🟡';
    lines.push(`${badge} ${e.name} (score: ${e.entropyScore.toFixed(2)})`);
    lines.push(`   Versions: ${e.versions.join(', ')}`);
    lines.push(`   Unique majors: ${e.uniqueMajors.join(', ')}`);
  }

  return lines.join('\n');
}
