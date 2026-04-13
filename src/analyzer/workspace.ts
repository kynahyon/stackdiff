import { DependencyMap } from '../parser';

export interface WorkspacePackage {
  name: string;
  version: string;
  path: string;
  dependencies: DependencyMap;
}

export interface WorkspaceOverlap {
  packageName: string;
  versions: Record<string, string[]>; // version -> workspace names
  hasConflict: boolean;
}

export interface WorkspaceAnalysis {
  packages: WorkspacePackage[];
  overlaps: WorkspaceOverlap[];
  conflicts: WorkspaceOverlap[];
  totalPackages: number;
  totalConflicts: number;
}

export function analyzeWorkspace(packages: WorkspacePackage[]): WorkspaceAnalysis {
  const depIndex: Record<string, Record<string, string[]>> = {};

  for (const pkg of packages) {
    for (const [dep, version] of Object.entries(pkg.dependencies)) {
      if (!depIndex[dep]) depIndex[dep] = {};
      if (!depIndex[dep][version]) depIndex[dep][version] = [];
      depIndex[dep][version].push(pkg.name);
    }
  }

  const overlaps: WorkspaceOverlap[] = [];
  for (const [packageName, versions] of Object.entries(depIndex)) {
    const hasConflict = Object.keys(versions).length > 1;
    overlaps.push({ packageName, versions, hasConflict });
  }

  const conflicts = overlaps.filter((o) => o.hasConflict);

  return {
    packages,
    overlaps,
    conflicts,
    totalPackages: packages.length,
    totalConflicts: conflicts.length,
  };
}

export function formatWorkspaceReport(analysis: WorkspaceAnalysis): string {
  const lines: string[] = [];
  lines.push(`Workspace Analysis: ${analysis.totalPackages} packages`);
  lines.push(`Conflicts: ${analysis.totalConflicts}`);

  if (analysis.conflicts.length === 0) {
    lines.push('No version conflicts found.');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('Version Conflicts:');
  for (const conflict of analysis.conflicts) {
    lines.push(`  ${conflict.packageName}:`);
    for (const [version, workspaces] of Object.entries(conflict.versions)) {
      lines.push(`    ${version} <- ${workspaces.join(', ')}`);
    }
  }

  return lines.join('\n');
}
