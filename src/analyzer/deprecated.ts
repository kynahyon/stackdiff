import { DependencyMap } from '../parser';

export type DeprecationStatus = 'deprecated' | 'active' | 'unknown';

export interface DeprecatedPackage {
  name: string;
  version: string;
  status: DeprecationStatus;
  message?: string;
}

export interface DeprecationAnalysis {
  deprecated: DeprecatedPackage[];
  active: DeprecatedPackage[];
  unknown: DeprecatedPackage[];
  totalChecked: number;
}

// Known deprecated packages with optional messages
const KNOWN_DEPRECATED: Record<string, string> = {
  request: 'request is deprecated. Use node-fetch, axios, or got instead.',
  'node-uuid': 'Use the uuid package instead.',
  jade: 'Renamed to pug.',
  'coffee-script': 'Use coffeescript (lowercase) instead.',
  bower: 'Bower is deprecated. Use npm or yarn workspaces.',
  gulp: 'Consider using npm scripts or modern build tools.',
  grunt: 'Consider using npm scripts or modern build tools.',
  'left-pad': 'Use String.prototype.padStart instead.',
  'right-pad': 'Use String.prototype.padEnd instead.',
};

export function classifyDeprecation(name: string): DeprecationStatus {
  if (KNOWN_DEPRECATED[name]) return 'deprecated';
  return 'unknown';
}

export function analyzeDeprecated(deps: DependencyMap): DeprecationAnalysis {
  const deprecated: DeprecatedPackage[] = [];
  const active: DeprecatedPackage[] = [];
  const unknown: DeprecatedPackage[] = [];

  for (const [name, version] of Object.entries(deps)) {
    const status = classifyDeprecation(name);
    const entry: DeprecatedPackage = {
      name,
      version,
      status,
      message: KNOWN_DEPRECATED[name],
    };
    if (status === 'deprecated') deprecated.push(entry);
    else if (status === 'active') active.push(entry);
    else unknown.push(entry);
  }

  return { deprecated, active, unknown, totalChecked: Object.keys(deps).length };
}

export function formatDeprecatedReport(analysis: DeprecationAnalysis): string {
  const lines: string[] = ['## Deprecation Analysis\n'];
  lines.push(`Checked ${analysis.totalChecked} packages.`);
  lines.push(`Deprecated: ${analysis.deprecated.length}\n`);

  if (analysis.deprecated.length === 0) {
    lines.push('No known deprecated packages found.');
    return lines.join('\n');
  }

  lines.push('### Deprecated Packages');
  for (const pkg of analysis.deprecated) {
    lines.push(`- **${pkg.name}** (${pkg.version})`);
    if (pkg.message) lines.push(`  > ${pkg.message}`);
  }

  return lines.join('\n');
}
