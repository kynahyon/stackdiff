import { Dependency } from '../parser';

export interface AliasEntry {
  name: string;
  alias: string;
  version: string;
  resolvedName: string;
}

export interface AliasAnalysis {
  aliases: AliasEntry[];
  total: number;
  uniqueResolved: number;
}

/**
 * Detects if a package name looks like an npm alias (e.g. "foo@npm:bar@1.2.3").
 * In lockfiles, aliased packages often appear with a key like "alias@npm:real@ver".
 */
export function isAlias(name: string): boolean {
  return name.includes('@npm:') || name.includes('@github:') || name.includes('@file:');
}

/**
 * Parses an alias string into its components.
 * e.g. "my-lodash@npm:lodash@4.17.21" -> { alias: "my-lodash", resolvedName: "lodash", version: "4.17.21" }
 */
export function parseAlias(name: string, version: string): AliasEntry | null {
  const npmMatch = name.match(/^(.+)@npm:(.+)@([^@]+)$/);
  if (npmMatch) {
    return {
      name,
      alias: npmMatch[1],
      version: npmMatch[3] || version,
      resolvedName: npmMatch[2],
    };
  }

  const githubMatch = name.match(/^(.+)@github:(.+)$/);
  if (githubMatch) {
    return {
      name,
      alias: githubMatch[1],
      version,
      resolvedName: githubMatch[2],
    };
  }

  return null;
}

export function analyzeAliases(deps: Dependency[]): AliasAnalysis {
  const aliases: AliasEntry[] = [];

  for (const dep of deps) {
    if (isAlias(dep.name)) {
      const entry = parseAlias(dep.name, dep.version);
      if (entry) {
        aliases.push(entry);
      }
    }
  }

  const uniqueResolved = new Set(aliases.map((a) => a.resolvedName)).size;

  return {
    aliases,
    total: aliases.length,
    uniqueResolved,
  };
}

export function formatAliasReport(analysis: AliasAnalysis): string {
  if (analysis.total === 0) {
    return 'No aliased packages found.';
  }

  const lines: string[] = [
    `Aliased Packages: ${analysis.total} (${analysis.uniqueResolved} unique resolved)`,
    '',
  ];

  for (const entry of analysis.aliases) {
    lines.push(`  ${entry.alias} -> ${entry.resolvedName}@${entry.version}`);
  }

  return lines.join('\n');
}
