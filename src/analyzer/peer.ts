import { DependencyMap } from '../parser/lockfile';

export interface PeerConflict {
  package: string;
  requires: string;
  requiredBy: string;
  installedVersion: string | null;
  compatible: boolean;
}

export interface PeerAnalysisResult {
  conflicts: PeerConflict[];
  missing: string[];
  satisfied: number;
  total: number;
}

export function extractPeerDeps(
  pkg: string,
  deps: DependencyMap
): Record<string, string> {
  const entry = deps[pkg];
  if (!entry || typeof entry !== 'object') return {};
  return (entry as any).peerDependencies ?? {};
}

export function checkPeerCompatibility(
  required: string,
  installed: string | null
): boolean {
  if (!installed) return false;
  if (required === '*') return true;
  const reqMajor = parseInt(required.replace(/[^\d].*/, ''), 10);
  const instMajor = parseInt(installed.split('.')[0], 10);
  if (isNaN(reqMajor) || isNaN(instMajor)) return false;
  return reqMajor === instMajor;
}

export function analyzePeerDependencies(
  deps: DependencyMap
): PeerAnalysisResult {
  const conflicts: PeerConflict[] = [];
  const missing: string[] = [];
  let satisfied = 0;
  let total = 0;

  for (const [pkg, meta] of Object.entries(deps)) {
    const peers = extractPeerDeps(pkg, deps);
    for (const [peer, versionRange] of Object.entries(peers)) {
      total++;
      const installedVersion = deps[peer]
        ? (deps[peer] as any).version ?? null
        : null;

      if (!installedVersion) {
        missing.push(`${pkg} requires peer ${peer}@${versionRange}`);
        conflicts.push({
          package: peer,
          requires: versionRange,
          requiredBy: pkg,
          installedVersion: null,
          compatible: false,
        });
        continue;
      }

      const compatible = checkPeerCompatibility(versionRange, installedVersion);
      if (!compatible) {
        conflicts.push({
          package: peer,
          requires: versionRange,
          requiredBy: pkg,
          installedVersion,
          compatible: false,
        });
      } else {
        satisfied++;
      }
    }
  }

  return { conflicts, missing, satisfied, total };
}

export function formatPeerReport(result: PeerAnalysisResult): string {
  const lines: string[] = ['## Peer Dependency Analysis\n'];
  lines.push(`Satisfied: ${result.satisfied}/${result.total}`);
  if (result.conflicts.length === 0) {
    lines.push('No peer dependency conflicts found.');
    return lines.join('\n');
  }
  lines.push(`\nConflicts (${result.conflicts.length}):`);
  for (const c of result.conflicts) {
    const inst = c.installedVersion ? `installed: ${c.installedVersion}` : 'not installed';
    lines.push(`  - ${c.requiredBy} needs ${c.package}@${c.requires} (${inst})`);
  }
  return lines.join('\n');
}
