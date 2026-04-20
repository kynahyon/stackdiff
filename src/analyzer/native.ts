/**
 * Analyzes dependencies for native (compiled) addon usage.
 * Native addons require build tools and may cause install failures.
 */

export interface NativePackage {
  name: string;
  version: string;
  reason: 'gyp' | 'nan' | 'napi' | 'bindings' | 'node-pre-gyp';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface NativeAnalysis {
  total: number;
  packages: NativePackage[];
  riskCounts: Record<string, number>;
}

const NATIVE_INDICATORS: Record<string, NativePackage['reason']> = {
  'node-gyp': 'gyp',
  'nan': 'nan',
  'node-addon-api': 'napi',
  'bindings': 'bindings',
  'node-pre-gyp': 'node-pre-gyp',
  '@mapbox/node-pre-gyp': 'node-pre-gyp',
};

const RISK_MAP: Record<NativePackage['reason'], NativePackage['riskLevel']> = {
  gyp: 'high',
  nan: 'medium',
  napi: 'low',
  bindings: 'medium',
  'node-pre-gyp': 'medium',
};

export function detectNativeReason(
  deps: Record<string, string> = {}
): NativePackage['reason'] | null {
  for (const [dep, reason] of Object.entries(NATIVE_INDICATORS)) {
    if (dep in deps) return reason;
  }
  return null;
}

export function analyzeNative(
  packages: Array<{ name: string; version: string; dependencies?: Record<string, string> }>
): NativeAnalysis {
  const nativePackages: NativePackage[] = [];

  for (const pkg of packages) {
    const reason = detectNativeReason(pkg.dependencies);
    if (reason) {
      nativePackages.push({
        name: pkg.name,
        version: pkg.version,
        reason,
        riskLevel: RISK_MAP[reason],
      });
    }
  }

  const riskCounts = nativePackages.reduce<Record<string, number>>((acc, p) => {
    acc[p.riskLevel] = (acc[p.riskLevel] ?? 0) + 1;
    return acc;
  }, {});

  return { total: nativePackages.length, packages: nativePackages, riskCounts };
}

export function formatNativeReport(analysis: NativeAnalysis): string {
  if (analysis.total === 0) {
    return '✅ No native addon dependencies detected.\n';
  }

  const lines: string[] = [
    `🔧 Native Addon Dependencies: ${analysis.total}`,
    '',
  ];

  const icons: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };

  for (const pkg of analysis.packages) {
    lines.push(`  ${icons[pkg.riskLevel]} ${pkg.name}@${pkg.version} — ${pkg.reason} (${pkg.riskLevel} risk)`);
  }

  lines.push('');
  lines.push('Risk summary:');
  for (const [level, count] of Object.entries(analysis.riskCounts)) {
    lines.push(`  ${icons[level]} ${level}: ${count}`);
  }

  return lines.join('\n') + '\n';
}
