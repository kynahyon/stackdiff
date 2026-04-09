import { DiffResult } from '../diff/compare';
import { SecurityRisk } from './security';
import { ImpactSummary } from './impact';

export interface HealthScore {
  overall: number;
  breakdown: {
    security: number;
    stability: number;
    freshness: number;
    compatibility: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

export function calculateSecurityScore(risks: SecurityRisk[]): number {
  if (risks.length === 0) return 100;
  const penalty = risks.reduce((acc, risk) => {
    if (risk.severity === 'high') return acc + 30;
    if (risk.severity === 'medium') return acc + 15;
    return acc + 5;
  }, 0);
  return Math.max(0, 100 - penalty);
}

export function calculateStabilityScore(diff: DiffResult): number {
  const total = diff.added.length + diff.removed.length + diff.updated.length;
  if (total === 0) return 100;
  const majorChanges = diff.updated.filter(u => {
    const [oldMajor] = (u.oldVersion || '0').split('.');
    const [newMajor] = (u.newVersion || '0').split('.');
    return oldMajor !== newMajor;
  }).length;
  const penalty = (majorChanges * 20) + (diff.removed.length * 10) + (diff.added.length * 2);
  return Math.max(0, 100 - penalty);
}

export function calculateFreshnessScore(impact: ImpactSummary): number {
  const { major, minor, patch } = impact.breakdown;
  const penalty = (major * 25) + (minor * 10) + (patch * 2);
  return Math.max(0, 100 - penalty);
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function calculateHealthScore(
  diff: DiffResult,
  risks: SecurityRisk[],
  impact: ImpactSummary
): HealthScore {
  const security = calculateSecurityScore(risks);
  const stability = calculateStabilityScore(diff);
  const freshness = calculateFreshnessScore(impact);
  const compatibility = diff.updated.length === 0 ? 100 : Math.max(0, 100 - diff.updated.length * 5);

  const overall = Math.round((security * 0.4) + (stability * 0.3) + (freshness * 0.2) + (compatibility * 0.1));
  const grade = scoreToGrade(overall);

  return {
    overall,
    breakdown: { security, stability, freshness, compatibility },
    grade,
    summary: `Dependency health score: ${overall}/100 (${grade})`
  };
}
