import { HealthScore } from '../analyzer/score';

const GRADE_COLORS: Record<string, string> = {
  A: '\x1b[32m',
  B: '\x1b[36m',
  C: '\x1b[33m',
  D: '\x1b[35m',
  F: '\x1b[31m'
};
const RESET = '\x1b[0m';

export function formatHealthScore(score: HealthScore, useColor = true): string {
  const color = useColor ? (GRADE_COLORS[score.grade] || '') : '';
  const reset = useColor ? RESET : '';

  const lines: string[] = [
    `${color}=== Dependency Health Report ===${reset}`,
    `Overall Score : ${color}${score.overall}/100${reset}`,
    `Grade         : ${color}${score.grade}${reset}`,
    '',
    'Breakdown:',
    `  Security      : ${score.breakdown.security}/100`,
    `  Stability     : ${score.breakdown.stability}/100`,
    `  Freshness     : ${score.breakdown.freshness}/100`,
    `  Compatibility : ${score.breakdown.compatibility}/100`,
    '',
    score.summary
  ];

  return lines.join('\n');
}

export function formatHealthScoreJson(score: HealthScore): string {
  return JSON.stringify(score, null, 2);
}

export function formatHealthScoreMarkdown(score: HealthScore): string {
  return [
    '## Dependency Health Report',
    '',
    `| Metric | Score |`,
    `|--------|-------|`,
    `| **Overall** | **${score.overall}/100 (${score.grade})** |`,
    `| Security | ${score.breakdown.security}/100 |`,
    `| Stability | ${score.breakdown.stability}/100 |`,
    `| Freshness | ${score.breakdown.freshness}/100 |`,
    `| Compatibility | ${score.breakdown.compatibility}/100 |`,
    '',
    `> ${score.summary}`
  ].join('\n');
}
