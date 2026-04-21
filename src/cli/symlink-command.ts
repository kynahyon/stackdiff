import { analyzeSymlinks, formatSymlinkReport, SymlinkAnalysis } from '../analyzer/symlink';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface SymlinkArgs {
  lockfile: string;
  format: 'text' | 'json';
  onlySymlinked: boolean;
}

export function parseSymlinkArgs(argv: string[]): SymlinkArgs {
  const args: SymlinkArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    onlySymlinked: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lockfile' || arg === '-l') {
      args.lockfile = argv[++i];
    } else if (arg === '--format' || arg === '-f') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--only-symlinked') {
      args.onlySymlinked = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runSymlinkCommand(argv: string[]): Promise<void> {
  const args = parseSymlinkArgs(argv);

  const raw = await readFile(args.lockfile);
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);

  let analysis = analyzeSymlinks(deps);

  if (args.onlySymlinked) {
    analysis = {
      ...analysis,
      entries: analysis.entries.filter((e) => e.status === 'symlinked'),
    };
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatSymlinkReport(analysis));
  }
}
