/**
 * Analyzes registry metadata for dependencies (npm, yarn, custom registries).
 */

export type RegistrySource = 'npm' | 'github' | 'gitlab' | 'custom' | 'unknown';

export interface RegistryEntry {
  name: string;
  version: string;
  registry: RegistrySource;
  registryUrl: string | null;
  isScoped: boolean;
  scope: string | null;
}

export interface RegistryAnalysis {
  entries: RegistryEntry[];
  byRegistry: Record<RegistrySource, RegistryEntry[]>;
  scopedCount: number;
  customRegistryCount: number;
}

export function detectRegistry(name: string, resolvedUrl?: string): RegistrySource {
  if (!resolvedUrl) return 'npm';
  if (resolvedUrl.includes('registry.npmjs.org')) return 'npm';
  if (resolvedUrl.includes('npm.pkg.github.com') || resolvedUrl.includes('github.com')) return 'github';
  if (resolvedUrl.includes('gitlab.com')) return 'gitlab';
  if (resolvedUrl.startsWith('https://') || resolvedUrl.startsWith('http://')) return 'custom';
  return 'unknown';
}

export function extractScope(name: string): string | null {
  if (name.startsWith('@')) {
    const parts = name.split('/');
    return parts[0] ?? null;
  }
  return null;
}

export function analyzeRegistry(
  deps: Array<{ name: string; version: string; resolved?: string }>
): RegistryAnalysis {
  const entries: RegistryEntry[] = deps.map((dep) => {
    const registry = detectRegistry(dep.name, dep.resolved);
    const scope = extractScope(dep.name);
    return {
      name: dep.name,
      version: dep.version,
      registry,
      registryUrl: dep.resolved ?? null,
      isScoped: scope !== null,
      scope,
    };
  });

  const byRegistry: Record<RegistrySource, RegistryEntry[]> = {
    npm: [],
    github: [],
    gitlab: [],
    custom: [],
    unknown: [],
  };

  for (const entry of entries) {
    byRegistry[entry.registry].push(entry);
  }

  return {
    entries,
    byRegistry,
    scopedCount: entries.filter((e) => e.isScoped).length,
    customRegistryCount: entries.filter((e) => e.registry === 'custom').length,
  };
}

export function formatRegistryReport(analysis: RegistryAnalysis): string {
  const lines: string[] = ['## Registry Analysis', ''];
  const total = analysis.entries.length;
  lines.push(`Total packages: ${total}`);
  lines.push(`Scoped packages: ${analysis.scopedCount}`);
  lines.push(`Custom registry packages: ${analysis.customRegistryCount}`);
  lines.push('');
  lines.push('### By Registry');
  for (const [reg, entries] of Object.entries(analysis.byRegistry)) {
    if (entries.length > 0) {
      lines.push(`  ${reg}: ${entries.length} package(s)`);
    }
  }
  if (analysis.customRegistryCount > 0) {
    lines.push('');
    lines.push('### Custom Registry Packages');
    for (const e of analysis.byRegistry.custom) {
      lines.push(`  - ${e.name}@${e.version} (${e.registryUrl})`);
    }
  }
  return lines.join('\n');
}
