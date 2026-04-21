import { analyzeLifecycle, formatLifecycleReport, LifecycleRisk } from '../analyzer/lifecycle';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface LifecycleArgs {
  lockfile: string;
  minRisk: LifecycleRisk;
  format: 'text' | 'json';
}

export function parseLifecycleArgs(argv: string[]): LifecycleArgs {
  const args: LifecycleArgs = {
    lockfile: 'package-lock.json',
    minRisk: 'low',
    format: 'text',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lockfile' || arg === '-l') {
      args.lockfile = argv[++i];
    } else if (arg === '--min-risk') {
      args.minRisk = argv[++i] as LifecycleRisk;
    } else if (arg === '--format' || arg === '-f') {
      args.format = argv[++i] as 'text' | 'json';
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

const RISK_ORDER: Record<LifecycleRisk, number> = { none: 0, low: 1, medium: 2, high: 3 };

export async function runLifecycleCommand(argv: string[]): Promise<void> {
  const args = parseLifecycleArgs(argv);
  const raw = await readFile(args.lockfile);
  const lockfile = parseLockfile(raw);
  const deps = extractDependencies(lockfile);

  let report = analyzeLifecycle(deps);

  if (args.minRisk !== 'none') {
    const minOrder = RISK_ORDER[args.minRisk];
    report = {
      ...report,
      entries: report.entries.filter(e => RISK_ORDER[e.risk] >= minOrder),
      totalWithHooks: report.entries.filter(e => RISK_ORDER[e.risk] >= minOrder).length,
      highRiskCount: report.entries.filter(e => e.risk === 'high').length,
    };
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatLifecycleReport(report));
  }
}
