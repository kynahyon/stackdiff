import { analyzeRegistry, formatRegistryReport, RegistryAnalysis } from '../analyzer/registry';
import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { readFile } from './runner';

export interface RegistryArgs {
  lockfile: string;
  format: 'text' | 'json';
  showCustomOnly: boolean;
}

export function parseRegistryArgs(argv: string[]): RegistryArgs {
  const args: RegistryArgs = {
    lockfile: 'package-lock.json',
    format: 'text',
    showCustomOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--lockfile' || arg === '-l') {
      args.lockfile = argv[++i] ?? args.lockfile;
    } else if (arg === '--format' || arg === '-f') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--custom-only') {
      args.showCustomOnly = true;
    } else if (!arg.startsWith('-')) {
      args.lockfile = arg;
    }
  }

  return args;
}

export async function runRegistryCommand(argv: string[]): Promise<void> {
  const args = parseRegistryArgs(argv);

  const content = await readFile(args.lockfile);
  const parsed = parseLockfile(content);
  const deps = extractDependencies(parsed);

  const rawDeps = deps.map((d) => ({
    name: d.name,
    version: d.version,
    resolved: d.resolved,
  }));

  let analysis: RegistryAnalysis = analyzeRegistry(rawDeps);

  if (args.showCustomOnly) {
    analysis = {
      ...analysis,
      entries: analysis.entries.filter((e) => e.registry === 'custom'),
    };
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatRegistryReport(analysis));
  }
}
