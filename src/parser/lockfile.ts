import fs from 'fs';
import path from 'path';

export interface PackageLock {
  name?: string;
  version?: string;
  lockfileVersion: number;
  packages: Record<string, PackageEntry>;
}

export interface PackageEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface ParsedDependency {
  name: string;
  version: string;
  dev: boolean;
}

export function parseLockfile(filePath: string): PackageLock {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Lockfile not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');

  try {
    const parsed = JSON.parse(content) as PackageLock;

    if (!parsed.packages) {
      throw new Error('Invalid lockfile format: missing "packages" field');
    }

    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Failed to parse lockfile JSON: ${err.message}`);
    }
    throw err;
  }
}

export function extractDependencies(lockfile: PackageLock): ParsedDependency[] {
  const deps: ParsedDependency[] = [];

  for (const [key, entry] of Object.entries(lockfile.packages)) {
    if (key === '') continue; // skip root package entry

    const name = key.startsWith('node_modules/')
      ? key.slice('node_modules/'.length)
      : key;

    deps.push({
      name,
      version: entry.version,
      dev: entry.dev ?? false,
    });
  }

  return deps;
}

/**
 * Groups an array of parsed dependencies into production and dev buckets.
 *
 * @param deps - The flat list returned by `extractDependencies`.
 * @returns An object with `prod` and `dev` arrays.
 */
export function groupDependencies(deps: ParsedDependency[]): {
  prod: ParsedDependency[];
  dev: ParsedDependency[];
} {
  return {
    prod: deps.filter((d) => !d.dev),
    dev: deps.filter((d) => d.dev),
  };
}

/**
 * Finds a single dependency by name from a list of parsed dependencies.
 *
 * @param deps - The flat list returned by `extractDependencies`.
 * @param name - The package name to look up.
 * @returns The matching `ParsedDependency`, or `undefined` if not found.
 */
export function findDependency(
  deps: ParsedDependency[],
  name: string
): ParsedDependency | undefined {
  return deps.find((d) => d.name === name);
}
