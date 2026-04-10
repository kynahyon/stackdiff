import { constraintSummary, parseConstraint, ConstraintType } from '../analyzer/semver';

const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  exact:   'Exact   ',
  patch:   'Patch   ',
  minor:   'Minor   ',
  major:   'Major   ',
  range:   'Range   ',
  unknown: 'Unknown ',
};

const CONSTRAINT_ICONS: Record<ConstraintType, string> = {
  exact:   '🔒',
  patch:   '🔧',
  minor:   '✨',
  major:   '🌐',
  range:   '📐',
  unknown: '❓',
};

export function formatSemverReport(
  versions: string[],
  format: 'text' | 'json' | 'markdown' = 'text'
): string {
  const constraints = versions.map(parseConstraint);
  const summary = constraintSummary(constraints);
  const total = versions.length;

  if (format === 'json') {
    return JSON.stringify({ total, summary, constraints }, null, 2);
  }

  if (format === 'markdown') {
    const rows = (Object.keys(summary) as ConstraintType[])
      .filter(k => summary[k] > 0)
      .map(k => `| ${CONSTRAINT_ICONS[k]} ${CONSTRAINT_LABELS[k].trim()} | ${summary[k]} | ${((summary[k] / total) * 100).toFixed(1)}% |`)
      .join('\n');
    return [
      '## Semver Constraint Analysis',
      '',
      `**Total packages:** ${total}`,
      '',
      '| Type | Count | Share |',
      '|------|-------|-------|',
      rows,
    ].join('\n');
  }

  // text format
  const lines = [`Semver Constraint Analysis (${total} packages)`, ''];
  for (const type of Object.keys(summary) as ConstraintType[]) {
    if (summary[type] === 0) continue;
    const pct = ((summary[type] / total) * 100).toFixed(1);
    lines.push(`  ${CONSTRAINT_ICONS[type]} ${CONSTRAINT_LABELS[type]} ${summary[type].toString().padStart(4)}  (${pct}%)`);
  }
  return lines.join('\n');
}
