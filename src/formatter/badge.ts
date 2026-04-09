/**
 * Generates badge-style summary strings for dependency diffs.
 * Useful for CI output, PR comments, and compact reporting.
 */

import { DiffSummary } from '../diff/compare';

export interface BadgeOptions {
  format?: 'text' | 'markdown' | 'shields';
}

/**
 * Returns a compact badge string summarizing the diff.
 */
export function renderBadge(summary: DiffSummary, options: BadgeOptions = {}): string {
  const { format = 'text' } = options;

  const { added, removed, updated, unchanged } = summary;
  const total = added + removed + updated;

  if (total === 0) {
    return format === 'markdown'
      ? '![deps](https://img.shields.io/badge/deps-no%20changes-brightgreen)'
      : '[deps: no changes]';
  }

  const parts: string[] = [];
  if (added > 0) parts.push(`+${added}`);
  if (removed > 0) parts.push(`-${removed}`);
  if (updated > 0) parts.push(`~${updated}`);

  const label = parts.join(' ');

  switch (format) {
    case 'markdown':
      return `**Dependency changes:** ${label} (${unchanged} unchanged)`;
    case 'shields': {
      const color = removed > 0 ? 'red' : added > 0 ? 'blue' : 'yellow';
      const encoded = encodeURIComponent(label);
      return `![deps](https://img.shields.io/badge/deps-${encoded}-${color})`;
    }
    case 'text':
    default:
      return `[deps: ${label}] (${unchanged} unchanged)`;
  }
}

/**
 * Returns a multi-line summary block suitable for PR comments.
 */
export function renderSummaryBlock(summary: DiffSummary): string {
  const { added, removed, updated, unchanged } = summary;
  const total = added + removed + updated;

  const lines: string[] = [
    '## Dependency Diff Summary',
    '',
    `| Change Type | Count |`,
    `|-------------|-------|`,
    `| ➕ Added    | ${added}     |`,
    `| ➖ Removed  | ${removed}     |`,
    `| 🔄 Updated  | ${updated}     |`,
    `| ✅ Unchanged| ${unchanged}     |`,
    '',
    total === 0
      ? '_No dependency changes detected._'
      : `_${total} package(s) changed._`,
  ];

  return lines.join('\n');
}
