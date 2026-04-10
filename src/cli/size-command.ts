import { parseLockfile, extractDependencies } from '../parser';
import { analyzeSizes, formatSizeReport } from '../analyzer/size';
import * as fs from 'fs';

export interface SizeCommandArgs {
  oldPath: string;
  newPath: string;
  format: 'text' | 'json';
  top: number;
}

export function parseSizeArgs(argv: string[]): SizeCommandArgs {
  const args: SizeCommandArgs = {
    oldPath: '',
    newPath: '',
    format: 'text',
    top: 10,
  };

  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--old' || argv[i] === '-o') && argv[i + 1]) {
      args.oldPath = argv[++i];
    } else if ((argv[i] === '--new' || argv[i] === '-n') && argv[i + 1]) {
      args.newPath = argv[++i];
    } else if (argv[i] === '--format' && argv[i + 1]) {
      const f = argv[++i];
      if (f === 'json' || f === 'text') args.format = f;
    } else if (argv[i] === '--top' && argv[i + 1]) {
      const t = parseInt(argv[++i], 10);
      if (!isNaN(t) && t > 0) args.top = t;
    }
  }

  return args;
}

export function runSizeCommand(argv: string[]): void {
  const args = parseSizeArgs(argv);

  if (!args.oldPath || !args.newPath) {
    console.error('Usage: stackdiff size --old <lockfile> --new <lockfile> [--format text|json] [--top N]');
    process.exit(1);
  }

  const oldContent = fs.readFileSync(args.oldPath, 'utf-8');
  const newContent = fs.readFileSync(args.newPath, 'utf-8');

  const oldDeps = extractDependencies(parseLockfile(oldContent));
  const newDeps = extractDependencies(parseLockfile(newContent));

  const report = analyzeSizes(oldDeps, newDeps);
  report.entries = report.entries.slice(0, args.top);

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatSizeReport(report));
  }
}
