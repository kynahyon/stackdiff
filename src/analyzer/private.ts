/**
 * Analyzes dependencies to identify private/internal packages
 * and packages sourced from non-public registries.
 */

export interface PrivatePackageInfo {
  name: string;
  version: string;
  isPrivate: boolean;
  source: 'npm' | 'github' | 'gitlab' | 'bitbucket' | 'local' | 'unknown';
  resolved?: string;
}

export interface PrivateAnalysisResult {
  total: number;
  privateCount: number;
  publicCount: number;
  packages: PrivatePackageInfo[];
}

export function detectSource(
  name: string,
  resolved?: string
): PrivatePackageInfo['source'] {
  if (!resolved) return 'unknown';
  if (resolved.includes('github.com') || resolved.startsWith('github:')) return 'github';
  if (resolved.includes('gitlab.com') || resolved.startsWith('gitlab:')) return 'gitlab';
  if (resolved.includes('bitbucket.org') || resolved.startsWith('bitbucket:')) return 'bitbucket';
  if (resolved.startsWith('file:') || resolved.startsWith('/') || resolved.startsWith('.')) return 'local';
  if (resolved.includes('registry.npmjs.org') || resolved.includes('npmjs.com')) return 'npm';
  return 'unknown';
}

export function isPrivatePackage(name: string, resolved?: string): boolean {
  if (name.startsWith('@') && !resolved?.includes('registry.npmjs.org')) return true;
  const source = detectSource(name, resolved);
  return source !== 'npm' && source !== 'unknown';
}

export function analyzePrivate(
  dependencies: Record<string, { version: string; resolved?: string }>
): PrivateAnalysisResult {
  const packages: PrivatePackageInfo[] = Object.entries(dependencies).map(
    ([name, { version, resolved }]) => ({
      name,
      version,
      isPrivate: isPrivatePackage(name, resolved),
      source: detectSource(name, resolved),
      resolved,
    })
  );

  return {
    total: packages.length,
    privateCount: packages.filter((p) => p.isPrivate).length,
    publicCount: packages.filter((p) => !p.isPrivate).length,
    packages,
  };
}

export function formatPrivateReport(result: PrivateAnalysisResult): string {
  const lines: string[] = [
    `Private/Non-Public Packages: ${result.privateCount} of ${result.total}`,
    '',
  ];

  const privatePackages = result.packages.filter((p) => p.isPrivate);
  if (privatePackages.length === 0) {
    lines.push('  No private or non-public packages detected.');
  } else {
    for (const pkg of privatePackages) {
      lines.push(`  ${pkg.name}@${pkg.version}  [source: ${pkg.source}]`);
      if (pkg.resolved) lines.push(`    resolved: ${pkg.resolved}`);
    }
  }

  return lines.join('\n');
}
