import { parseArgs } from './args';
import { readFile } from './runner';
import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { buildDependencyGraph } from '../analyzer/graph';
import { analyzeTransitive, formatTransitiveReport } from '../analyzer/transitive';

export interface TransitiveArgs {
  lockfile: string;
  maxDepth: number;
  format: 'text' | 'json';
}

export function parseTransitiveArgs(argv: string[]): TransitiveArgs {
  const args = parseArgs(argv);
  return {
    lockfile: (args['lockfile'] as string) ?? 'package-lock.json',
    maxDepth: parseInt((args['max-depth'] as string) ?? '10', 10),
    format: ((args['format'] as string) ?? 'text') as 'text' | 'json',
  };
}

export async function runTransitiveCommand(argv: string[]): Promise<void> {
  const args = parseTransitiveArgs(argv);

  const raw = await readFile(args.lockfile);
  const lockfile = parseLockfile(raw);
  const deps = extractDependencies(lockfile);

  const directNames = deps
    .filter(d => d.type === 'direct')
    .map(d => d.name);

  const graph = buildDependencyGraph(deps);
  const analysis = analyzeTransitive(graph, directNames);

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  console.log(formatTransitiveReport(analysis));
}
