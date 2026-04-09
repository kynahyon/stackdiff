import { DiffResult } from '../diff/compare';

export interface TrendEntry {
  date: string;
  added: number;
  removed: number;
  updated: number;
  total: number;
}

export interface TrendSummary {
  entries: TrendEntry[];
  averageAdded: number;
  averageRemoved: number;
  averageUpdated: number;
  mostActiveDate: string | null;
}

export function buildTrendEntry(date: string, diff: DiffResult): TrendEntry {
  const added = diff.added.length;
  const removed = diff.removed.length;
  const updated = diff.updated.length;
  return {
    date,
    added,
    removed,
    updated,
    total: added + removed + updated,
  };
}

export function analyzeTrends(entries: TrendEntry[]): TrendSummary {
  if (entries.length === 0) {
    return {
      entries: [],
      averageAdded: 0,
      averageRemoved: 0,
      averageUpdated: 0,
      mostActiveDate: null,
    };
  }

  const count = entries.length;
  const averageAdded = entries.reduce((sum, e) => sum + e.added, 0) / count;
  const averageRemoved = entries.reduce((sum, e) => sum + e.removed, 0) / count;
  const averageUpdated = entries.reduce((sum, e) => sum + e.updated, 0) / count;

  const mostActive = entries.reduce((max, e) => (e.total > max.total ? e : max), entries[0]);

  return {
    entries,
    averageAdded: Math.round(averageAdded * 100) / 100,
    averageRemoved: Math.round(averageRemoved * 100) / 100,
    averageUpdated: Math.round(averageUpdated * 100) / 100,
    mostActiveDate: mostActive.date,
  };
}

export function formatTrendReport(summary: TrendSummary): string {
  if (summary.entries.length === 0) {
    return 'No trend data available.';
  }
  const lines: string[] = [
    '## Dependency Trend Report',
    `Entries analyzed: ${summary.entries.length}`,
    `Average added per snapshot:   ${summary.averageAdded}`,
    `Average removed per snapshot: ${summary.averageRemoved}`,
    `Average updated per snapshot: ${summary.averageUpdated}`,
    `Most active date: ${summary.mostActiveDate}`,
  ];
  return lines.join('\n');
}
