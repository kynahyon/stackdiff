import chalk from 'chalk';
import { DiffSummary, DependencyChange } from '../diff/compare';

export type OutputFormat = 'text' | 'json' | 'markdown';

export function formatOutput(summary: DiffSummary, format: OutputFormat = 'text'): string {
  switch (format) {
    case 'json':
      return formatJson(summary);
    case 'markdown':
      return formatMarkdown(summary);
    case 'text':
    default:
      return formatText(summary);
  }
}

function formatText(summary: DiffSummary): string {
  const lines: string[] = [];

  lines.push(chalk.bold('\nDependency Changes Summary'));
  lines.push(`  Added:    ${chalk.green(String(summary.added.length))}`);
  lines.push(`  Removed:  ${chalk.red(String(summary.removed.length))}`);
  lines.push(`  Updated:  ${chalk.yellow(String(summary.updated.length))}`);
  lines.push(`  Unchanged:${chalk.gray(String(summary.unchanged.length))}`);

  if (summary.added.length > 0) {
    lines.push(chalk.green('\n+ Added:'));
    summary.added.forEach((dep) => {
      lines.push(chalk.green(`  + ${dep.name}@${dep.newVersion}`));
    });
  }

  if (summary.removed.length > 0) {
    lines.push(chalk.red('\n- Removed:'));
    summary.removed.forEach((dep) => {
      lines.push(chalk.red(`  - ${dep.name}@${dep.oldVersion}`));
    });
  }

  if (summary.updated.length > 0) {
    lines.push(chalk.yellow('\n~ Updated:'));
    summary.updated.forEach((dep) => {
      lines.push(chalk.yellow(`  ~ ${dep.name}: ${dep.oldVersion} → ${dep.newVersion}`));
    });
  }

  return lines.join('\n');
}

function formatJson(summary: DiffSummary): string {
  return JSON.stringify(summary, null, 2);
}

function formatMarkdown(summary: DiffSummary): string {
  const lines: string[] = [];

  lines.push('## Dependency Changes\n');
  lines.push(`| Type | Count |`);
  lines.push(`|------|-------|`);
  lines.push(`| Added | ${summary.added.length} |`);
  lines.push(`| Removed | ${summary.removed.length} |`);
  lines.push(`| Updated | ${summary.updated.length} |`);
  lines.push(`| Unchanged | ${summary.unchanged.length} |`);

  if (summary.added.length > 0) {
    lines.push('\n### Added\n');
    summary.added.forEach((dep) => lines.push(`- \`${dep.name}@${dep.newVersion}\``));
  }

  if (summary.removed.length > 0) {
    lines.push('\n### Removed\n');
    summary.removed.forEach((dep) => lines.push(`- \`${dep.name}@${dep.oldVersion}\``));
  }

  if (summary.updated.length > 0) {
    lines.push('\n### Updated\n');
    summary.updated.forEach((dep) =>
      lines.push(`- \`${dep.name}\`: \`${dep.oldVersion}\` → \`${dep.newVersion}\``)
    );
  }

  return lines.join('\n');
}
