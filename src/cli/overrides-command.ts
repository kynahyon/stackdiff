import { analyzeOverrides, formatOverridesReport, OverridesReport } from '../analyzer/overrides';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface OverridesArgs {
  lockfile: string;
  format: 'text' | 'json';
  nestedOnly: boolean;
}

export function parseOverridesArgs(argv: string[]): OverridesArgs {
  const args: OverridesArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    nestedOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lockfile' || arg === '-l') {
      args.lockfile = argv[++i];
    } else if (arg === '--format' || arg === '-f') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--nested-only') {
      args.nestedOnly = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runOverridesCommand(argv: string[]): Promise<void> {
  const args = parseOverridesArgs(argv);
  const raw = await readFile(args.lockfile);
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);

  let report: OverridesReport = analyzeOverrides(deps);

  if (args.nestedOnly) {
    report = {
      ...report,
      entries: report.entries.filter((e) => e.isNested),
      totalCount: report.nestedCount,
      topLevelCount: 0,
    };
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatOverridesReport(report));
  }
}
