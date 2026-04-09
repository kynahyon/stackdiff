import { formatHealthScore, formatHealthScoreJson, formatHealthScoreMarkdown } from './health';
import { HealthScore } from '../analyzer/score';

const mockScore: HealthScore = {
  overall: 82,
  grade: 'B',
  breakdown: {
    security: 90,
    stability: 80,
    freshness: 75,
    compatibility: 85
  },
  summary: 'Dependency health score: 82/100 (B)'
};

describe('formatHealthScore', () => {
  it('includes overall score and grade', () => {
    const output = formatHealthScore(mockScore, false);
    expect(output).toContain('82/100');
    expect(output).toContain('Grade');
    expect(output).toContain('B');
  });

  it('includes all breakdown metrics', () => {
    const output = formatHealthScore(mockScore, false);
    expect(output).toContain('Security');
    expect(output).toContain('Stability');
    expect(output).toContain('Freshness');
    expect(output).toContain('Compatibility');
  });

  it('includes color codes when useColor is true', () => {
    const output = formatHealthScore(mockScore, true);
    expect(output).toContain('\x1b[');
  });
});

describe('formatHealthScoreJson', () => {
  it('returns valid JSON', () => {
    const output = formatHealthScoreJson(mockScore);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('contains all fields', () => {
    const parsed = JSON.parse(formatHealthScoreJson(mockScore));
    expect(parsed.overall).toBe(82);
    expect(parsed.grade).toBe('B');
    expect(parsed.breakdown).toBeDefined();
  });
});

describe('formatHealthScoreMarkdown', () => {
  it('renders a markdown table', () => {
    const output = formatHealthScoreMarkdown(mockScore);
    expect(output).toContain('|');
    expect(output).toContain('82/100');
    expect(output).toContain('## Dependency Health Report');
  });

  it('includes summary as blockquote', () => {
    const output = formatHealthScoreMarkdown(mockScore);
    expect(output).toContain('> Dependency health score');
  });
});
