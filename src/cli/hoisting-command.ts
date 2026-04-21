import { analyzeHoisting, formatHoistReport, HoistReport } from '../analyzer/hoisting';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface HoistingArgs {
  lockfile: string;
  format: 'text' | 'json';
  showAll: boolean;
}

export function parseHoistingArgs(argv: string[]): HoistingArgs {
  const args: HoistingArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    showAll: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--all') {
      args.showAll = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runHoistingCommand(argv: string[]): Promise<void> {
  const args = parseHoistingArgs(argv);

  const raw = await readFile(args.lockfile);
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);
  const report: HoistReport = analyzeHoisting(deps);

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    if (!args.showAll) {
      const filtered = {
        ...report,
        entries: report.entries.filter(e => e.status === 'conflicted'),
      };
      console.log(formatHoistReport(filtered));
    } else {
      console.log(formatHoistReport(report));
    }
  }
}
