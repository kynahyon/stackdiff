import * as fs from 'fs';
import * as path from 'path';
import { parseLockfile } from '../parser/lockfile';
import { analyzePeerDependencies, formatPeerReport } from '../analyzer/peer';

export interface PeerCommandArgs {
  lockfile: string;
  format: 'text' | 'json';
  failOnConflict: boolean;
}

export function parsePeerArgs(argv: string[]): PeerCommandArgs {
  const args: PeerCommandArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    failOnConflict: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--fail-on-conflict') {
      args.failOnConflict = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runPeerCommand(argv: string[]): Promise<void> {
  const args = parsePeerArgs(argv);
  const lockfilePath = path.resolve(process.cwd(), args.lockfile);

  if (!fs.existsSync(lockfilePath)) {
    console.error(`Error: lockfile not found at ${lockfilePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(lockfilePath, 'utf-8');
  const parsed = parseLockfile(content);
  const result = analyzePeerDependencies(parsed.dependencies ?? {});

  if (args.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatPeerReport(result));
  }

  if (args.failOnConflict && result.conflicts.length > 0) {
    process.exit(1);
  }
}
