import { Dependency } from '../parser';

export type SymlinkStatus = 'symlinked' | 'normal' | 'unknown';

export interface SymlinkEntry {
  name: string;
  version: string;
  status: SymlinkStatus;
  resolvedPath?: string;
}

export interface SymlinkAnalysis {
  entries: SymlinkEntry[];
  symlinkCount: number;
  normalCount: number;
  unknownCount: number;
}

export function detectSymlinkStatus(dep: Dependency): SymlinkStatus {
  const resolved = dep.resolved ?? '';
  if (resolved.startsWith('file:') || resolved.startsWith('link:')) {
    return 'symlinked';
  }
  if (resolved === '' && !dep.version) {
    return 'unknown';
  }
  return 'normal';
}

export function extractResolvedPath(dep: Dependency): string | undefined {
  const resolved = dep.resolved ?? '';
  if (resolved.startsWith('file:')) return resolved.slice(5);
  if (resolved.startsWith('link:')) return resolved.slice(5);
  return undefined;
}

export function analyzeSymlinks(deps: Dependency[]): SymlinkAnalysis {
  const entries: SymlinkEntry[] = deps.map((dep) => {
    const status = detectSymlinkStatus(dep);
    return {
      name: dep.name,
      version: dep.version ?? 'unknown',
      status,
      resolvedPath: extractResolvedPath(dep),
    };
  });

  return {
    entries,
    symlinkCount: entries.filter((e) => e.status === 'symlinked').length,
    normalCount: entries.filter((e) => e.status === 'normal').length,
    unknownCount: entries.filter((e) => e.status === 'unknown').length,
  };
}

export function formatSymlinkReport(analysis: SymlinkAnalysis): string {
  const lines: string[] = [
    `Symlink Analysis`,
    `================`,
    `Symlinked: ${analysis.symlinkCount}  Normal: ${analysis.normalCount}  Unknown: ${analysis.unknownCount}`,
    '',
  ];

  const symlinked = analysis.entries.filter((e) => e.status === 'symlinked');
  if (symlinked.length === 0) {
    lines.push('No symlinked dependencies found.');
  } else {
    lines.push('Symlinked dependencies:');
    for (const entry of symlinked) {
      const path = entry.resolvedPath ? ` -> ${entry.resolvedPath}` : '';
      lines.push(`  ${entry.name}@${entry.version}${path}`);
    }
  }

  return lines.join('\n');
}
