/**
 * Security analyzer for dependency changes
 * Identifies potential security risks in version changes
 */

import { DependencyChange } from '../diff/compare';

export interface SecurityIssue {
  package: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'major-downgrade' | 'outdated-major' | 'pre-release' | 'yanked';
  message: string;
  oldVersion?: string;
  newVersion?: string;
}

export interface SecurityReport {
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Analyze dependency changes for security concerns
 */
export function analyzeSecurityRisks(changes: DependencyChange[]): SecurityReport {
  const issues: SecurityIssue[] = [];

  for (const change of changes) {
    // Check for major version downgrades
    if (change.type === 'modified' && change.oldVersion && change.newVersion) {
      const oldMajor = getMajorVersion(change.oldVersion);
      const newMajor = getMajorVersion(change.newVersion);

      if (oldMajor > newMajor) {
        issues.push({
          package: change.name,
          severity: 'high',
          type: 'major-downgrade',
          message: `Major version downgrade detected (${change.oldVersion} → ${change.newVersion})`,
          oldVersion: change.oldVersion,
          newVersion: change.newVersion,
        });
      }
    }

    // Check for pre-release versions
    if (change.newVersion && isPreRelease(change.newVersion)) {
      issues.push({
        package: change.name,
        severity: 'medium',
        type: 'pre-release',
        message: `Pre-release version detected: ${change.newVersion}`,
        newVersion: change.newVersion,
      });
    }

    // Check for outdated major versions (removed packages)
    if (change.type === 'removed') {
      issues.push({
        package: change.name,
        severity: 'low',
        type: 'outdated-major',
        message: `Package removed from dependencies`,
        oldVersion: change.oldVersion,
      });
    }
  }

  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  return { issues, summary };
}

function getMajorVersion(version: string): number {
  const match = version.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function isPreRelease(version: string): boolean {
  return /-alpha|-beta|-rc|-pre|-dev/.test(version);
}
