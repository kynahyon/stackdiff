import { analyzeResolutions, formatResolutionReport } from '../analyzer/resolve';
import { readFile } from './runner';
import { parseLockfile, extractDependencies } from '../parser/lockfile';

export interface ResolveArgs {
  lockfile: string;
  resolutionsFile?: string;
  format: 'text' | 'json';
  minLevel: 'patch' | 'minor' | 'major';
}

export function parseResolveArgs(argv: string[]): ResolveArgs {
  const args: ResolveArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    minLevel: 'patch',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if (arg === '--resolutions' && argv[i + 1]) {
      args.resolutionsFile = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      args.format = argv[++i] as ResolveArgs['format'];
    } else if (arg === '--min-level' && argv[i + 1]) {
      args.minLevel = argv[++i] as ResolveArgs['minLevel'];
    }
  }

  return args;
}

const LEVEL_RANK: Record<string, number> = { patch: 0, minor: 1, major: 2 };

export async function runResolveCommand(argv: string[]): Promise<void> {
  const args = parseResolveArgs(argv);

  const lockfileContent = await readFile(args.lockfile);
  const parsed = parseLockfile(lockfileContent);
  const deps = extractDependencies(parsed);

  let resolutions: Record<string, string> = {};
  if (args.resolutionsFile) {
    const raw = await readFile(args.resolutionsFile);
    const pkg = JSON.parse(raw) as { resolutions?: Record<string, string> };
    resolutions = pkg.resolutions ?? {};
  }

  const report = analyzeResolutions(deps, resolutions);

  const minRank = LEVEL_RANK[args.minLevel] ?? 0;
  report.conflicts = report.conflicts.filter(
    (c) => LEVEL_RANK[c.conflictLevel] >= minRank
  );

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(formatResolutionReport(report));
}
