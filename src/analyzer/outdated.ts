import { DependencyChange } from '../diff/compare';

export interface OutdatedInfo {
  name: string;
  current: string;
  latest: string;
  severity: 'patch' | 'minor' | 'major' | 'unknown';
  versionsBehind: number;
}

export interface OutdatedReport {
  total: number;
  byseverity: Record<string, OutdatedInfo[]>;
  items: OutdatedInfo[];
}

export function classifyOutdated(
  name: string,
  current: string,
  latest: string
): OutdatedInfo['severity'] {
  const currentParts = current.replace(/^[^\d]*/, '').split('.').map(Number);
  const latestParts = latest.replace(/^[^\d]*/, '').split('.').map(Number);

  if (currentParts.length < 3 || latestParts.length < 3) return 'unknown';

  const [curMajor, curMinor] = currentParts;
  const [latMajor, latMinor] = latestParts;

  if (latMajor > curMajor) return 'major';
  if (latMinor > curMinor) return 'minor';
  return 'patch';
}

export function countVersionsBehind(current: string, latest: string): number {
  const toNum = (v: string) =>
    v
      .replace(/^[^\d]*/, '')
      .split('.')
      .map(Number)
      .reduce((acc, n, i) => acc + n * Math.pow(100, 2 - i), 0);

  const cur = toNum(current);
  const lat = toNum(latest);
  return lat > cur ? lat - cur : 0;
}

export function analyzeOutdated(
  changes: DependencyChange[]
): OutdatedReport {
  const updated = changes.filter(
    (c) => c.type === 'updated' && c.oldVersion && c.newVersion
  );

  const items: OutdatedInfo[] = updated.map((c) => {
    const current = c.oldVersion!;
    const latest = c.newVersion!;
    return {
      name: c.name,
      current,
      latest,
      severity: classifyOutdated(c.name, current, latest),
      versionsBehind: countVersionsBehind(current, latest),
    };
  });

  const byseverity: Record<string, OutdatedInfo[]> = {
    major: [],
    minor: [],
    patch: [],
    unknown: [],
  };

  for (const item of items) {
    byseverity[item.severity].push(item);
  }

  return {
    total: items.length,
    byseverity,
    items,
  };
}
