import { buildTrendEntry, analyzeTrends, formatTrendReport, TrendEntry } from './trends';
import { DiffResult } from '../diff/compare';

const makeDiff = (added: string[], removed: string[], updated: string[]): DiffResult => ({
  added: added.map((name) => ({ name, version: '1.0.0' })),
  removed: removed.map((name) => ({ name, version: '1.0.0' })),
  updated: updated.map((name) => ({ name, from: '1.0.0', to: '2.0.0' })),
  unchanged: [],
});

describe('buildTrendEntry', () => {
  it('builds a trend entry from a diff result', () => {
    const diff = makeDiff(['a', 'b'], ['c'], ['d', 'e', 'f']);
    const entry = buildTrendEntry('2024-01-01', diff);
    expect(entry.date).toBe('2024-01-01');
    expect(entry.added).toBe(2);
    expect(entry.removed).toBe(1);
    expect(entry.updated).toBe(3);
    expect(entry.total).toBe(6);
  });

  it('handles empty diff', () => {
    const diff = makeDiff([], [], []);
    const entry = buildTrendEntry('2024-01-02', diff);
    expect(entry.total).toBe(0);
  });
});

describe('analyzeTrends', () => {
  it('returns empty summary for no entries', () => {
    const summary = analyzeTrends([]);
    expect(summary.entries).toHaveLength(0);
    expect(summary.mostActiveDate).toBeNull();
    expect(summary.averageAdded).toBe(0);
  });

  it('calculates averages correctly', () => {
    const entries: TrendEntry[] = [
      { date: '2024-01-01', added: 2, removed: 1, updated: 3, total: 6 },
      { date: '2024-01-02', added: 4, removed: 0, updated: 1, total: 5 },
    ];
    const summary = analyzeTrends(entries);
    expect(summary.averageAdded).toBe(3);
    expect(summary.averageRemoved).toBe(0.5);
    expect(summary.averageUpdated).toBe(2);
  });

  it('identifies the most active date', () => {
    const entries: TrendEntry[] = [
      { date: '2024-01-01', added: 1, removed: 0, updated: 0, total: 1 },
      { date: '2024-01-02', added: 5, removed: 3, updated: 2, total: 10 },
      { date: '2024-01-03', added: 2, removed: 1, updated: 1, total: 4 },
    ];
    const summary = analyzeTrends(entries);
    expect(summary.mostActiveDate).toBe('2024-01-02');
  });
});

describe('formatTrendReport', () => {
  it('returns a message when no data', () => {
    const summary = analyzeTrends([]);
    expect(formatTrendReport(summary)).toBe('No trend data available.');
  });

  it('includes key metrics in the report', () => {
    const entries: TrendEntry[] = [
      { date: '2024-03-01', added: 3, removed: 1, updated: 2, total: 6 },
    ];
    const summary = analyzeTrends(entries);
    const report = formatTrendReport(summary);
    expect(report).toContain('Dependency Trend Report');
    expect(report).toContain('2024-03-01');
    expect(report).toContain('Entries analyzed: 1');
  });
});
