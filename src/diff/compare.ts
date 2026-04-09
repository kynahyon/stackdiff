import { DependencyMap } from '../parser/lockfile';

export interface DependencyChange {
  name: string;
  type: 'added' | 'removed' | 'upgraded' | 'downgraded' | 'unchanged';
  from?: string;
  to?: string;
}

export interface DiffResult {
  added: DependencyChange[];
  removed: DependencyChange[];
  upgraded: DependencyChange[];
  downgraded: DependencyChange[];
  unchanged: DependencyChange[];
}

export function compareDependencies(
  before: DependencyMap,
  after: DependencyMap
): DiffResult {
  const result: DiffResult = {
    added: [],
    removed: [],
    upgraded: [],
    downgraded: [],
    unchanged: [],
  };

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const name of allKeys) {
    const fromVersion = before[name];
    const toVersion = after[name];

    if (!fromVersion) {
      result.added.push({ name, type: 'added', to: toVersion });
    } else if (!toVersion) {
      result.removed.push({ name, type: 'removed', from: fromVersion });
    } else if (fromVersion === toVersion) {
      result.unchanged.push({ name, type: 'unchanged', from: fromVersion, to: toVersion });
    } else {
      const changeType = compareVersions(fromVersion, toVersion);
      result[changeType].push({ name, type: changeType, from: fromVersion, to: toVersion });
    }
  }

  return result;
}

function compareVersions(from: string, to: string): 'upgraded' | 'downgraded' {
  const fromParts = from.replace(/^[^\d]*/, '').split('.').map(Number);
  const toParts = to.replace(/^[^\d]*/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(fromParts.length, toParts.length); i++) {
    const a = fromParts[i] ?? 0;
    const b = toParts[i] ?? 0;
    if (b > a) return 'upgraded';
    if (b < a) return 'downgraded';
  }

  return 'upgraded';
}

export function summarizeDiff(diff: DiffResult): string {
  const parts: string[] = [];
  if (diff.added.length) parts.push(`${diff.added.length} added`);
  if (diff.removed.length) parts.push(`${diff.removed.length} removed`);
  if (diff.upgraded.length) parts.push(`${diff.upgraded.length} upgraded`);
  if (diff.downgraded.length) parts.push(`${diff.downgraded.length} downgraded`);
  if (!parts.length) return 'No changes detected.';
  return parts.join(', ');
}
