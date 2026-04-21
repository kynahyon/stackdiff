import { Dependency } from '../parser';

export interface OverrideEntry {
  name: string;
  originalVersion: string;
  overriddenVersion: string;
  isNested: boolean;
  path?: string;
}

export interface OverridesReport {
  entries: OverrideEntry[];
  totalCount: number;
  nestedCount: number;
  topLevelCount: number;
}

export function detectOverrides(deps: Dependency[]): OverrideEntry[] {
  const entries: OverrideEntry[] = [];

  for (const dep of deps) {
    if (!dep.resolved && dep.version !== dep.specifier) {
      entries.push({
        name: dep.name,
        originalVersion: dep.specifier ?? dep.version,
        overriddenVersion: dep.version,
        isNested: dep.path !== undefined && dep.path.includes('/node_modules/'),
        path: dep.path,
      });
    }

    if (dep.overrides) {
      for (const [pkg, version] of Object.entries(dep.overrides)) {
        entries.push({
          name: pkg,
          originalVersion: '*',
          overriddenVersion: version as string,
          isNested: true,
          path: dep.name,
        });
      }
    }
  }

  return entries;
}

export function analyzeOverrides(deps: Dependency[]): OverridesReport {
  const entries = detectOverrides(deps);
  const nestedCount = entries.filter((e) => e.isNested).length;
  return {
    entries,
    totalCount: entries.length,
    nestedCount,
    topLevelCount: entries.length - nestedCount,
  };
}

export function formatOverridesReport(report: OverridesReport): string {
  if (report.totalCount === 0) {
    return 'No overrides detected.';
  }

  const lines: string[] = [
    `Overrides detected: ${report.totalCount} (top-level: ${report.topLevelCount}, nested: ${report.nestedCount})`,
    '',
  ];

  for (const entry of report.entries) {
    const label = entry.isNested ? '[nested]' : '[top-level]';
    const pathInfo = entry.path ? ` via ${entry.path}` : '';
    lines.push(
      `  ${label} ${entry.name}: ${entry.originalVersion} → ${entry.overriddenVersion}${pathInfo}`
    );
  }

  return lines.join('\n');
}
