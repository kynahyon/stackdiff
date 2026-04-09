import { Command } from 'commander';

export interface CliOptions {
  format: 'text' | 'json' | 'markdown';
  filter?: 'added' | 'removed' | 'updated' | 'unchanged';
  verbose: boolean;
  noColor: boolean;
}

export interface CliArgs {
  lockfileA: string;
  lockfileB: string;
  options: CliOptions;
}

export function parseArgs(argv: string[] = process.argv): CliArgs {
  const program = new Command();

  program
    .name('stackdiff')
    .description('Compare and visualize dependency changes between package.json lockfile versions')
    .version('1.0.0')
    .argument('<lockfileA>', 'Path to the base lockfile (e.g., package-lock.json)')
    .argument('<lockfileB>', 'Path to the target lockfile to compare against')
    .option('-f, --format <format>', 'Output format: text, json, or markdown', 'text')
    .option('--filter <type>', 'Filter results by change type: added, removed, updated, unchanged')
    .option('-v, --verbose', 'Show additional details including unchanged dependencies', false)
    .option('--no-color', 'Disable colored output', false)
    .parse(argv);

  const [lockfileA, lockfileB] = program.args;
  const opts = program.opts();

  if (!lockfileA || !lockfileB) {
    program.help();
    process.exit(1);
  }

  const format = opts.format as CliOptions['format'];
  if (!['text', 'json', 'markdown'].includes(format)) {
    console.error(`Error: Invalid format "${format}". Must be one of: text, json, markdown`);
    process.exit(1);
  }

  if (opts.filter && !['added', 'removed', 'updated', 'unchanged'].includes(opts.filter)) {
    console.error(`Error: Invalid filter "${opts.filter}". Must be one of: added, removed, updated, unchanged`);
    process.exit(1);
  }

  return {
    lockfileA,
    lockfileB,
    options: {
      format,
      filter: opts.filter,
      verbose: opts.verbose,
      noColor: opts.noColor,
    },
  };
}
