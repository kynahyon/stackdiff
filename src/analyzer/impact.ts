/**
 * Impact analyzer for dependency changes
 * Calculates and categorizes the impact of version changes
 */

import { DependencyChange } from '../diff/compare';

export type ImpactLevel = 'breaking' | 'major' | 'minor' | 'patch' | 'none';

export interface ImpactAnalysis {
  package: string;
  level: ImpactLevel;
  changeType: 'added' | 'removed' | 'modified';
  versionChange?: {
    from: string;
    to: string;
    semverType: 'major' | 'minor' | 'patch' | 'unknown';
  };
}

export interface ImpactSummary {
  breaking: number;
  major: number;
  minor: number;
  patch: number;
  none: number;
  totalPackages: number;
}

/**
 * Analyze the impact of dependency changes
 */
export function analyzeImpact(changes: DependencyChange[]): ImpactAnalysis[] {
  return changes.map(change => {
    if (change.type === 'added') {
      return {
        package: change.name,
        level: 'minor' as ImpactLevel,
        changeType: 'added',
      };
    }

    if (change.type === 'removed') {
      return {
        package: change.name,
        level: 'breaking' as ImpactLevel,
        changeType: 'removed',
      };
    }

    // Modified package
    const semverType = determineSemverChange(change.oldVersion!, change.newVersion!);
    const level = mapSemverToImpact(semverType);

    return {
      package: change.name,
      level,
      changeType: 'modified',
      versionChange: {
        from: change.oldVersion!,
        to: change.newVersion!,
        semverType,
      },
    };
  });
}

/**
 * Summarize impact analysis results
 */
export function summarizeImpact(analyses: ImpactAnalysis[]): ImpactSummary {
  return {
    breaking: analyses.filter(a => a.level === 'breaking').length,
    major: analyses.filter(a => a.level === 'major').length,
    minor: analyses.filter(a => a.level === 'minor').length,
    patch: analyses.filter(a => a.level === 'patch').length,
    none: analyses.filter(a => a.level === 'none').length,
    totalPackages: analyses.length,
  };
}

function determineSemverChange(oldVersion: string, newVersion: string): 'major' | 'minor' | 'patch' | 'unknown' {
  const oldParts = parseVersion(oldVersion);
  const newParts = parseVersion(newVersion);

  if (!oldParts || !newParts) return 'unknown';

  if (oldParts.major !== newParts.major) return 'major';
  if (oldParts.minor !== newParts.minor) return 'minor';
  if (oldParts.patch !== newParts.patch) return 'patch';

  return 'unknown';
}

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function mapSemverToImpact(semverType: 'major' | 'minor' | 'patch' | 'unknown'): ImpactLevel {
  const mapping: Record<string, ImpactLevel> = {
    major: 'breaking',
    minor: 'minor',
    patch: 'patch',
    unknown: 'none',
  };

  return mapping[semverType];
}
