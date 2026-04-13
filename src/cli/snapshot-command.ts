import * as path from 'path';
import { parseLockfile, extractDependencies } from '../parser';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  formatSnapshotList,
} from '../analyzer/snapshot';
import { compareDependencies, summarizeDiff } from '../diff';
import { formatOutput } from '../formatter';

export interface SnapshotArgs {
  subcommand: 'save' | 'list' | 'diff';
  lockfile?: string;
  label?: string;
  compareLabel?: string;
  storePath: string;
  format: 'text' | 'json' | 'markdown';
}

export function parseSnapshotArgs(argv: string[]): SnapshotArgs {
  const args: SnapshotArgs = {
    subcommand: 'list',
    storePath: '.stackdiff-snapshots.json',
    format: 'text',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === 'save') args.subcommand = 'save';
    else if (arg === 'list') args.subcommand = 'list';
    else if (arg === 'diff') args.subcommand = 'diff';
    else if (arg === '--lockfile' || arg === '-f') args.lockfile = argv[++i];
    else if (arg === '--label' || arg === '-l') args.label = argv[++i];
    else if (arg === '--compare' || arg === '-c') args.compareLabel = argv[++i];
    else if (arg === '--store') args.storePath = argv[++i];
    else if (arg === '--format') args.format = argv[++i] as SnapshotArgs['format'];
  }
  return args;
}

/**
 * Loads a snapshot by label and exits with an error message if it is not found.
 */
function loadSnapshotOrExit(label: string, storePath: string) {
  const snap = loadSnapshot(label, storePath);
  if (!snap) {
    console.error(`Error: snapshot "${label}" not found in ${storePath}`);
    process.exit(1);
  }
  return snap;
}

export async function runSnapshotCommand(args: SnapshotArgs): Promise<void> {
  const storePath = path.resolve(args.storePath);

  if (args.subcommand === 'list') {
    const snaps = listSnapshots(storePath);
    console.log(formatSnapshotList(snaps));
    return;
  }

  if (args.subcommand === 'save') {
    if (!args.lockfile || !args.label) {
      console.error('Error: --lockfile and --label are required for save');
      process.exit(1);
    }
    const raw = require('fs').readFileSync(path.resolve(args.lockfile), 'utf-8');
    const parsed = parseLockfile(raw);
    const deps = extractDependencies(parsed);
    const snap = createSnapshot(args.label, deps);
    saveSnapshot(snap, storePath);
    console.log(`Snapshot "${args.label}" saved (${Object.keys(deps).length} deps).`);
    return;
  }

  if (args.subcommand === 'diff') {
    if (!args.label || !args.compareLabel) {
      console.error('Error: --label and --compare are required for diff');
      process.exit(1);
    }
    const snapA = loadSnapshotOrExit(args.label, storePath);
    const snapB = loadSnapshotOrExit(args.compareLabel, storePath);
    const diff = compareDependencies(snapA.dependencies, snapB.dependencies);
    const summary = summarizeDiff(diff);
    console.log(formatOutput({ diff, summary }, args.format));
  }
}
