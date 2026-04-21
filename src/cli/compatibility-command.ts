import { analyzeCompatibility, formatCompatibilityReport } from '../analyzer/compatibility';
import { parseLockfile, extractDependencies } from '../parser';
import { readFile } from './runner';

export interface CompatibilityArgs {
  lockfile: string;
  node: string;
  format: 'text' | 'json';
  onlyIncompatible: boolean;
}

export function parseCompatibilityArgs(argv: string[]): CompatibilityArgs {
  const args: CompatibilityArgs = {
    lockfile: 'package-lock.json',
    node: process.version,
    format: 'text',
    onlyIncompatible: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--lockfile' || arg === '-l') && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if ((arg === '--node' || arg === '-n') && argv[i + 1]) {
      args.node = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      args.format = argv[++i] as 'text' | 'json';
    } else if (arg === '--only-incompatible') {
      args.onlyIncompatible = true;
    }
  }

  return args;
}

export async function runCompatibilityCommand(argv: string[]): Promise<void> {
  const args = parseCompatibilityArgs(argv);

  let raw: string;
  try {
    raw = await readFile(args.lockfile);
  } catch {
    console.error(`Error: could not read lockfile at ${args.lockfile}`);
    process.exit(1);
  }

  const parsed = parseLockfile(raw!);
  let deps = extractDependencies(parsed);

  const report = analyzeCompatibility(deps, args.node);

  if (args.onlyIncompatible) {
    report.results = report.results.filter((r) => !r.compatible);
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatCompatibilityReport(report));
  }

  if (report.incompatibleCount > 0) {
    process.exit(1);
  }
}
