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

/**
 * Reads a file from disk, returning its content or a RunResult error on failure.
 */
function readFile(filePath: string): { content: string } | RunResult {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }
  try {
    return { content: fs.readFileSync(filePath, 'utf-8') };
  } catch (err: any) {
    return { success: false, error: `Failed to read file: ${err.message}` };
  }
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

  const fromResult = readFile(fromPath);
  if ('error' in fromResult) return fromResult as RunResult;

  const toResult = readFile(toPath);
  if ('error' in toResult) return toResult as RunResult;

  const fromContent = (fromResult as { content: string }).content;
  const toContent = (toResult as { content: string }).content;

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
