export interface BundleEntry {
  name: string;
  version: string;
  estimatedKB: number;
  gzippedKB: number;
  treeshakable: boolean;
}

export interface BundleAnalysis {
  entries: BundleEntry[];
  totalKB: number;
  totalGzippedKB: number;
  largestPackages: BundleEntry[];
  treeshakableCount: number;
}

const KNOWN_SIZES: Record<string, { kb: number; gzip: number; treeshakable: boolean }> = {
  react: { kb: 6.4, gzip: 2.8, treeshakable: false },
  "react-dom": { kb: 130, gzip: 42, treeshakable: false },
  lodash: { kb: 531, gzip: 96, treeshakable: false },
  "lodash-es": { kb: 531, gzip: 96, treeshakable: true },
  axios: { kb: 52, gzip: 14, treeshakable: false },
  moment: { kb: 299, gzip: 72, treeshakable: false },
  dayjs: { kb: 6.5, gzip: 2.6, treeshakable: true },
  vue: { kb: 98, gzip: 36, treeshakable: true },
  express: { kb: 208, gzip: 60, treeshakable: false },
  typescript: { kb: 10240, gzip: 2048, treeshakable: false },
};

export function estimateBundleSize(name: string, version: string): BundleEntry {
  const known = KNOWN_SIZES[name];
  const estimatedKB = known?.kb ?? 20;
  const gzippedKB = known?.gzip ?? estimatedKB * 0.3;
  const treeshakable = known?.treeshakable ?? false;
  return { name, version, estimatedKB, gzippedKB, treeshakable };
}

export function analyzeBundleImpact(
  deps: Record<string, string>
): BundleAnalysis {
  const entries = Object.entries(deps).map(([name, version]) =>
    estimateBundleSize(name, version)
  );

  const totalKB = entries.reduce((sum, e) => sum + e.estimatedKB, 0);
  const totalGzippedKB = entries.reduce((sum, e) => sum + e.gzippedKB, 0);
  const largestPackages = [...entries]
    .sort((a, b) => b.estimatedKB - a.estimatedKB)
    .slice(0, 5);
  const treeshakableCount = entries.filter((e) => e.treeshakable).length;

  return { entries, totalKB, totalGzippedKB, largestPackages, treeshakableCount };
}

export function formatBundleReport(analysis: BundleAnalysis): string {
  const lines: string[] = ["## Bundle Impact Analysis", ""];
  lines.push(`Total estimated size: ${analysis.totalKB.toFixed(1)} KB (${analysis.totalGzippedKB.toFixed(1)} KB gzipped)`);
  lines.push(`Tree-shakable packages: ${analysis.treeshakableCount} / ${analysis.entries.length}`);
  lines.push("");
  lines.push("### Largest Packages");
  for (const pkg of analysis.largestPackages) {
    const shake = pkg.treeshakable ? " [tree-shakable]" : "";
    lines.push(`  ${pkg.name}@${pkg.version}: ${pkg.estimatedKB.toFixed(1)} KB (${pkg.gzippedKB.toFixed(1)} KB gz)${shake}`);
  }
  return lines.join("\n");
}
