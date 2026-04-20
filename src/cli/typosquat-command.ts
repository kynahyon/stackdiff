import { analyzeTyposquat, formatTyposquatReport, TyposquatReport } from '../analyzer/typosquat';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface TyposquatArgs {
  lockfile: string;
  format: 'text' | 'json';
  minConfidence: 'high' | 'medium' | 'low';
}

export function parseTyposquatArgs(argv: string[]): TyposquatArgs {
  const args: TyposquatArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    minConfidence: 'low',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format' || arg === '-f') {
      const val = argv[++i];
      if (val === 'json' || val === 'text') args.format = val;
    } else if (arg === '--min-confidence') {
      const val = argv[++i];
      if (val === 'high' || val === 'medium' || val === 'low') args.minConfidence = val;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

function filterByConfidence(
  report: TyposquatReport,
  min: 'high' | 'medium' | 'low'
): TyposquatReport {
  const order = { high: 3, medium: 2, low: 1 };
  const filtered = report.suspicious.filter(
    r => order[r.confidence] >= order[min]
  );
  return { ...report, suspicious: filtered, total: filtered.length };
}

export async function runTyposquatCommand(argv: string[]): Promise<void> {
  const args = parseTyposquatArgs(argv);
  const raw = await readFile(args.lockfile);
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);

  let report = analyzeTyposquat(deps);
  report = filterByConfidence(report, args.minConfidence);

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    process.stdout.write(formatTyposquatReport(report));
  }

  if (report.total > 0) process.exit(1);
}
