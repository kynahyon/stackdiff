import * as fs from 'fs';
import * as path from 'path';
import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { analyzePinned, formatPinnedReport } from '../analyzer/pinned';

export interface PinnedArgs {
  lockfile: string;
  format: 'text' | 'json';
  onlyUnpinned: boolean;
}

export function parsePinnedArgs(argv: string[]): PinnedArgs {
  const args: PinnedArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    onlyUnpinned: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lockfile' || arg === '-l') {
      args.lockfile = argv[++i];
    } else if (arg === '--format' || arg === '-f') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--only-unpinned') {
      args.onlyUnpinned = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export function runPinnedCommand(argv: string[]): void {
  const args = parsePinnedArgs(argv);
  const lockfilePath = path.resolve(process.cwd(), args.lockfile);

  if (!fs.existsSync(lockfilePath)) {
    console.error(`Error: Lockfile not found: ${lockfilePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(lockfilePath, 'utf-8');
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);

  const report = analyzePinned(deps);

  if (args.onlyUnpinned) {
    report.entries = report.entries.filter((e) => e.status !== 'exact');
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatPinnedReport(report));
  }
}
