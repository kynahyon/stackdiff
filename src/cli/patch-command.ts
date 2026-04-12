import * as fs from 'fs';
import { parseLockfile } from '../parser/lockfile';
import { compareDependencies } from '../diff/compare';
import { analyzePatchChanges, formatPatchReport, PatchSummary } from '../analyzer/patch';

export interface PatchArgs {
  oldFile: string;
  newFile: string;
  format: 'text' | 'json';
  patchOnly: boolean;
}

export function parsePatchArgs(argv: string[]): PatchArgs {
  const args: PatchArgs = {
    oldFile: '',
    newFile: '',
    format: 'text',
    patchOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--format':
        args.format = argv[++i] as 'text' | 'json';
        break;
      case '--patch-only':
        args.patchOnly = true;
        break;
      default:
        if (!args.oldFile) args.oldFile = argv[i];
        else if (!args.newFile) args.newFile = argv[i];
    }
  }

  return args;
}

export function runPatchCommand(args: PatchArgs): void {
  if (!args.oldFile || !args.newFile) {
    console.error('Usage: stackdiff patch <old-lockfile> <new-lockfile> [--format text|json] [--patch-only]');
    process.exit(1);
  }

  const oldContent = fs.readFileSync(args.oldFile, 'utf-8');
  const newContent = fs.readFileSync(args.newFile, 'utf-8');

  const oldDeps = parseLockfile(oldContent);
  const newDeps = parseLockfile(newContent);
  const diff = compareDependencies(oldDeps, newDeps);

  let summary = analyzePatchChanges(diff);

  if (args.patchOnly) {
    summary = {
      ...summary,
      patches: summary.patches.filter((p) => p.isPatch),
      totalMinor: 0,
      totalMajor: 0,
    };
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(formatPatchReport(summary));
  }
}
