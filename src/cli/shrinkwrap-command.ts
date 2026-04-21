import { analyzeShrinkwrap, formatShrinkwrapReport } from '../analyzer/shrinkwrap';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface ShrinkwrapArgs {
  lockfile: string;
  packageJson: string;
  format: 'text' | 'json';
  failOnDrift: boolean;
}

export function parseShrinkwrapArgs(argv: string[]): ShrinkwrapArgs {
  const args: ShrinkwrapArgs = {
    lockfile: 'package-lock.json',
    packageJson: 'package.json',
    format: 'text',
    failOnDrift: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if ((arg === '--package' || arg === '-p') && argv[i + 1]) {
      args.packageJson = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      args.format = argv[++i] as 'text' | 'json';
    } else if (arg === '--fail-on-drift') {
      args.failOnDrift = true;
    }
  }

  return args;
}

export async function runShrinkwrapCommand(args: ShrinkwrapArgs): Promise<void> {
  const lockfileContent = await readFile(args.lockfile);
  const packageContent = await readFile(args.packageJson);

  const parsed = parseLockfile(lockfileContent);
  const resolved = extractDependencies(parsed);

  let declared: { name: string; version: string; type: 'dependency' }[] = [];
  try {
    const pkg = JSON.parse(packageContent);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    declared = Object.entries(allDeps).map(([name, version]) => ({
      name,
      version: String(version),
      type: 'dependency' as const,
    }));
  } catch {
    process.stderr.write('Failed to parse package.json\n');
    process.exit(1);
  }

  const analysis = analyzeShrinkwrap(resolved, declared);

  if (args.format === 'json') {
    process.stdout.write(JSON.stringify(analysis, null, 2) + '\n');
  } else {
    process.stdout.write(formatShrinkwrapReport(analysis) + '\n');
  }

  if (args.failOnDrift && (analysis.driftedCount > 0 || analysis.missingCount > 0)) {
    process.exit(1);
  }
}
