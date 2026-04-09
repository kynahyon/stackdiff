import { parseLockfile, extractDependencies } from '../parser';
import { compareDependencies } from '../diff';
import { analyzeSecurityRisks } from '../analyzer/security';
import { analyzeImpact, summarizeImpact } from '../analyzer/impact';
import { calculateHealthScore } from '../analyzer/score';
import { formatHealthScore, formatHealthScoreJson, formatHealthScoreMarkdown } from '../formatter/health';
import * as fs from 'fs';

export interface HealthCommandArgs {
  oldLockfile: string;
  newLockfile: string;
  format: 'text' | 'json' | 'markdown';
}

export function parseHealthArgs(argv: string[]): HealthCommandArgs {
  const formatIndex = argv.indexOf('--format');
  const format = (formatIndex !== -1 ? argv[formatIndex + 1] : 'text') as 'text' | 'json' | 'markdown';
  const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--format');
  return {
    oldLockfile: positional[0] || '',
    newLockfile: positional[1] || '',
    format
  };
}

export async function runHealthCommand(args: HealthCommandArgs): Promise<void> {
  if (!args.oldLockfile || !args.newLockfile) {
    console.error('Usage: stackdiff health <old-lockfile> <new-lockfile> [--format text|json|markdown]');
    process.exit(1);
  }

  const oldContent = fs.readFileSync(args.oldLockfile, 'utf-8');
  const newContent = fs.readFileSync(args.newLockfile, 'utf-8');

  const oldParsed = parseLockfile(oldContent);
  const newParsed = parseLockfile(newContent);

  const oldDeps = extractDependencies(oldParsed);
  const newDeps = extractDependencies(newParsed);

  const diff = compareDependencies(oldDeps, newDeps);
  const risks = analyzeSecurityRisks(diff);
  const impactResults = analyzeImpact(diff);
  const impact = summarizeImpact(impactResults);
  const score = calculateHealthScore(diff, risks, impact);

  let output: string;
  if (args.format === 'json') {
    output = formatHealthScoreJson(score);
  } else if (args.format === 'markdown') {
    output = formatHealthScoreMarkdown(score);
  } else {
    output = formatHealthScore(score);
  }

  console.log(output);
}
