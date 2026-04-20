import { analyzeNative, formatNativeReport, NativeAnalysis } from '../analyzer/native';
import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { readFile } from './runner';

export interface NativeArgs {
  lockfile: string;
  format: 'text' | 'json';
  minRisk: 'low' | 'medium' | 'high';
}

export function parseNativeArgs(argv: string[]): NativeArgs {
  const args: NativeArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    minRisk: 'low',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--min-risk' && argv[i + 1]) {
      const risk = argv[++i];
      if (risk === 'low' || risk === 'medium' || risk === 'high') args.minRisk = risk;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

const RISK_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };

function filterByMinRisk(analysis: NativeAnalysis, minRisk: string): NativeAnalysis {
  const filtered = analysis.packages.filter(
    (p) => RISK_ORDER[p.riskLevel] >= RISK_ORDER[minRisk]
  );
  const riskCounts = filtered.reduce<Record<string, number>>((acc, p) => {
    acc[p.riskLevel] = (acc[p.riskLevel] ?? 0) + 1;
    return acc;
  }, {});
  return { total: filtered.length, packages: filtered, riskCounts };
}

export async function runNativeCommand(argv: string[]): Promise<void> {
  const args = parseNativeArgs(argv);

  const raw = await readFile(args.lockfile);
  const lockfile = parseLockfile(raw);
  const deps = extractDependencies(lockfile);

  const allPackages = deps.map((d) => ({
    name: d.name,
    version: d.version,
    dependencies: (lockfile.packages?.[`node_modules/${d.name}`]?.dependencies) ?? {},
  }));

  const analysis = filterByMinRisk(analyzeNative(allPackages), args.minRisk);

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    process.stdout.write(formatNativeReport(analysis));
  }
}
