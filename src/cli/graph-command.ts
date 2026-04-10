import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { buildDependencyGraph, formatGraphReport, DependencyGraph } from '../analyzer/graph';
import * as fs from 'fs';

export interface GraphArgs {
  lockfile: string;
  format: 'text' | 'json';
  package?: string;
}

export function parseGraphArgs(argv: string[]): GraphArgs {
  const args: GraphArgs = { lockfile: 'package-lock.json', format: 'text' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lockfile' || argv[i] === '-l') {
      args.lockfile = argv[++i];
    } else if (argv[i] === '--format' || argv[i] === '-f') {
      args.format = argv[++i] as 'text' | 'json';
    } else if (argv[i] === '--package' || argv[i] === '-p') {
      args.package = argv[++i];
    }
  }
  return args;
}

export function runGraphCommand(argv: string[]): void {
  const args = parseGraphArgs(argv);

  if (!fs.existsSync(args.lockfile)) {
    console.error(`Error: lockfile not found: ${args.lockfile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(args.lockfile, 'utf-8');
  const parsed = parseLockfile(raw);
  const deps = extractDependencies(parsed);
  const graph = buildDependencyGraph(deps);

  if (args.format === 'json') {
    const output: Record<string, unknown> = { nodes: graph.nodes, roots: graph.roots };
    if (args.package) {
      const node = graph.nodes[args.package];
      output.focused = node ?? null;
    }
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(formatGraphReport(graph));
    if (args.package) {
      const node = graph.nodes[args.package];
      if (node) {
        console.log(`\nPackage: ${node.name}@${node.version}`);
        console.log(`Dependents: ${node.dependents.join(', ') || 'none'}`);
        console.log(`Dependencies: ${node.dependencies.join(', ') || 'none'}`);
      } else {
        console.log(`\nPackage '${args.package}' not found in lockfile.`);
      }
    }
  }
}
