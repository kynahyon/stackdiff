import { parseArgs } from './args';
import { parseLockfile } from '../parser';
import { compareDependencies, summarizeDiff } from '../diff';
import { formatOutput } from '../formatter';
import * as fs from 'fs';
import * as path from 'path';

export interface RunResult {
  success: boolean;
  output?: string;
  error?: string;
}

export async function run(argv: string[]): Promise<RunResult> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err: any) {
    return { success: false, error: `Argument error: ${err.message}` };
  }

  const fromPath = path.resolve(args.from);
  const toPath = path.resolve(args.to);

  if (!fs.existsSync(fromPath)) {
    return { success: false, error: `File not found: ${fromPath}` };
  }
  if (!fs.existsSync(toPath)) {
    return { success: false, error: `File not found: ${toPath}` };
  }

  let fromContent: string;
  let toContent: string;
  try {
    fromContent = fs.readFileSync(fromPath, 'utf-8');
    toContent = fs.readFileSync(toPath, 'utf-8');
  } catch (err: any) {
    return { success: false, error: `Failed to read file: ${err.message}` };
  }

  let fromDeps;
  let toDeps;
  try {
    fromDeps = parseLockfile(fromContent);
    toDeps = parseLockfile(toContent);
  } catch (err: any) {
    return { success: false, error: `Failed to parse lockfile: ${err.message}` };
  }

  const diff = compareDependencies(fromDeps, toDeps);
  const summary = summarizeDiff(diff);
  const output = formatOutput(diff, summary, args.format);

  return { success: true, output };
}

export async function main(): Promise<void> {
  const result = await run(process.argv.slice(2));
  if (!result.success) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.output) {
    console.log(result.output);
  }
}
