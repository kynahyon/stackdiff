import { DependencyChange } from '../diff/compare';

interface TableOptions {
  showUnchanged?: boolean;
}

export function renderTable(changes: DependencyChange[], options: TableOptions = {}): string {
  const { showUnchanged = false } = options;

  const filtered = showUnchanged
    ? changes
    : changes.filter((c) => c.changeType !== 'unchanged');

  if (filtered.length === 0) {
    return 'No dependency changes found.\n';
  }

  const headers = ['Package', 'Change', 'From', 'To'];
  const rows = filtered.map((dep) => [
    dep.name,
    dep.changeType.toUpperCase(),
    dep.oldVersion ?? '-',
    dep.newVersion ?? '-',
  ]);

  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length))
  );

  const separator = colWidths.map((w) => '-'.repeat(w + 2)).join('+');
  const formatRow = (row: string[]) =>
    row.map((cell, i) => ` ${cell.padEnd(colWidths[i])} `).join('|');

  const lines: string[] = [];
  lines.push(separator);
  lines.push(formatRow(headers));
  lines.push(separator);
  rows.forEach((row) => lines.push(formatRow(row)));
  lines.push(separator);

  return lines.join('\n') + '\n';
}

export function groupByChangeType(changes: DependencyChange[]): Record<string, DependencyChange[]> {
  return changes.reduce(
    (acc, dep) => {
      const key = dep.changeType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(dep);
      return acc;
    },
    {} as Record<string, DependencyChange[]>
  );
}
