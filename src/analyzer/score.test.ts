import {
  calculateSecurityScore,
  calculateStabilityScore,
  calculateFreshnessScore,
  scoreToGrade,
  calculateHealthScore
} from './score';
import { DiffResult } from '../diff/compare';
import { SecurityRisk } from './security';
import { ImpactSummary } from './impact';

const emptyDiff: DiffResult = { added: [], removed: [], updated: [], unchanged: [] };
const emptyImpact: ImpactSummary = { total: 0, breakdown: { major: 0, minor: 0, patch: 0, unknown: 0 }, highestImpact: 'none' };

describe('calculateSecurityScore', () => {
  it('returns 100 when no risks', () => {
    expect(calculateSecurityScore([])).toBe(100);
  });

  it('penalizes high severity risks heavily', () => {
    const risks: SecurityRisk[] = [{ name: 'pkg', severity: 'high', reason: 'test', version: '1.0.0' }];
    expect(calculateSecurityScore(risks)).toBe(70);
  });

  it('does not go below 0', () => {
    const risks: SecurityRisk[] = Array(10).fill({ name: 'pkg', severity: 'high', reason: 'x', version: '1.0.0' });
    expect(calculateSecurityScore(risks)).toBe(0);
  });
});

describe('calculateStabilityScore', () => {
  it('returns 100 for empty diff', () => {
    expect(calculateStabilityScore(emptyDiff)).toBe(100);
  });

  it('penalizes major version changes', () => {
    const diff: DiffResult = {
      ...emptyDiff,
      updated: [{ name: 'pkg', oldVersion: '1.0.0', newVersion: '2.0.0' }]
    };
    expect(calculateStabilityScore(diff)).toBeLessThan(100);
  });
});

describe('calculateFreshnessScore', () => {
  it('returns 100 for no changes', () => {
    expect(calculateFreshnessScore(emptyImpact)).toBe(100);
  });

  it('penalizes major updates', () => {
    const impact: ImpactSummary = { ...emptyImpact, total: 2, breakdown: { major: 2, minor: 0, patch: 0, unknown: 0 } };
    expect(calculateFreshnessScore(impact)).toBe(50);
  });
});

describe('scoreToGrade', () => {
  it('returns A for 90+', () => expect(scoreToGrade(95)).toBe('A'));
  it('returns B for 75-89', () => expect(scoreToGrade(80)).toBe('B'));
  it('returns F for below 45', () => expect(scoreToGrade(30)).toBe('F'));
});

describe('calculateHealthScore', () => {
  it('returns a full health score object', () => {
    const result = calculateHealthScore(emptyDiff, [], emptyImpact);
    expect(result.overall).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.breakdown).toHaveProperty('security');
  });
});
