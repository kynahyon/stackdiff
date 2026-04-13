import * as path from 'path';
import { readFile } from './runner';
import { parseLockfile } from '../parser/lockfile';
import { analyzeScripts, formatScriptsReport } from '../analyzer/scripts';

export interface ScriptsArgs {
  lockfile: string;
  risk?: 'high' | 'medium' | 'low';
  json: boolean;
}

export function parseScriptsArgs(argv: string[]): ScriptsArgs {
  const args: ScriptsArgs = { lockfile: 'package-lock.json', json: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      args.json = true;
    } else if (arg === '--risk' && argv[i + 1]) {
      const val = argv[++i];
      if (val === 'high' || val === 'medium' || val === 'low') {
        args.risk = val;
      }
    } else if (!arg.startsWith('--')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runScriptsCommand(
  argv: string[],
  cwd = process.cwd()
): Promise<void> {
  const args = parseScriptsArgs(argv);
  const lockfilePath = path.resolve(cwd, args.lockfile);

  let raw: string;
  try {
    raw = await readFile(lockfilePath);
  } catch {
    console: could not read lockfile at ${lockfilePath}`);
    process.exit(1);
  }

  const parsed = parseLockfile(raw!);
  let analysis = analyzeScripts(parsed.dependencies ?? {});

  if (args.risk) {
    const order = ['high', 'medium', 'low'];
    const minIdx = order.indexOf(args.risk);
    analysis = {
      ...analysis,
      entries: analysis.entries.filter(
        (e) => order.indexOf(e.risk) <= minIdx
      ),
    };
    analysis = {
      ...analysis,
      totalWithScripts: analysis.entries.length,
      highRisk: analysis.entries.filter((e) => e.risk === 'high').length,
      mediumRisk: analysis.entries.filter((e) => e.risk === 'medium').length,
    };
  }

  if (args.json) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    process.stdout.write(formatScriptsReport(analysis));
  }
}
