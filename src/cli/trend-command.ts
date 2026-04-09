import { DiffResult } from '../diff/compare';
import { buildTrendEntry, analyzeTrends, formatTrendReport, TrendEntry } from '../analyzer/trends';

export interface TrendCommandOptions {
  snapshots: Array<{ date: string; diff: DiffResult }>;
  json?: boolean;
}

export function runTrendCommand(options: TrendCommandOptions): string {
  const { snapshots, json = false } = options;

  if (snapshots.length === 0) {
    return json
      ? JSON.stringify({ error: 'No snapshots provided' }, null, 2)
      : 'Error: No snapshots provided for trend analysis.';
  }

  const entries: TrendEntry[] = snapshots.map(({ date, diff }) =>
    buildTrendEntry(date, diff)
  );

  const summary = analyzeTrends(entries);

  if (json) {
    return JSON.stringify(summary, null, 2);
  }

  return formatTrendReport(summary);
}

export function parseTrendArgs(argv: string[]): { dates: string[] } {
  const dateFlag = '--dates';
  const idx = argv.indexOf(dateFlag);
  if (idx === -1 || idx + 1 >= argv.length) {
    return { dates: [] };
  }
  const dates = argv[idx + 1].split(',').map((d) => d.trim()).filter(Boolean);
  return { dates };
}
