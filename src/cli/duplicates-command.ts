import { parseLockfile, extractDependencies } from '../parser';
import { analyzeDuplicates, formatDuplicatesReport } from '../analyzer/duplicates';
import { readFileSync } from 'fs';

export interface DuplicatesCommandArgs {
  lockfile: string;
  json: boolean;
}

export function parseDuplicatesArgs(argv: string[]): DuplicatesCommandArgs {
  const args: DuplicatesCommandArgs = {
    lockfile: 'package-lock.json',
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') {
      args.json = true;
    } else if (!argv[i].startsWith('--')) {
      args.lockfile = argv[i];
    }
  }

  return args;
}

export async function runDuplicatesCommand(argv: string[]): Promise<void> {
  const args = parseDuplicatesArgs(argv);

  let raw: string;
  try {
    raw = readFileSync(args.lockfile, 'utf-8');
  } catch {
    console.error(`Error: Could not read lockfile at "${args.lockfile}"`);
    process.exit(1);
    return;
  }

  const parsed = parseLockfile(raw);
  const dependencies = extractDependencies(parsed);
  const report = analyzeDuplicates(dependencies);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatDuplicatesReport(report));
  }
}
