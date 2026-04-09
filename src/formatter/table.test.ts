import { renderTable, groupByChangeType } from './table';
import { DependencyChange } from '../diff/compare';

const changes: DependencyChange[] = [
  { name: 'express', oldVersion: '4.17.1', newVersion: '4.18.2', changeType: 'updated' },
  { name: 'axios', oldVersion: null, newVersion: '1.4.0', changeType: 'added' },
  { name: 'request', oldVersion: '2.88.2', newVersion: null, changeType: 'removed' },
  { name: 'chalk', oldVersion: '5.0.0', newVersion: '5.0.0', changeType: 'unchanged' },
];

describe('renderTable', () => {
  it('renders a table with changed dependencies', () => {
    const result = renderTable(changes);
    expect(result).toContain('express');
    expect(result).toContain('axios');
    expect(result).toContain('request');
  });

  it('excludes unchanged by default', () => {
    const result = renderTable(changes);
    expect(result).not.toContain('chalk');
  });

  it('includes unchanged when option is set', () => {
    const result = renderTable(changes, { showUnchanged: true });
    expect(result).toContain('chalk');
  });

  it('shows version from and to columns', () => {
    const result = renderTable(changes);
    expect(result).toContain('4.17.1');
    expect(result).toContain('4.18.2');
  });

  it('returns no-changes message for empty filtered list', () => {
    const onlyUnchanged: DependencyChange[] = [
      { name: 'chalk', oldVersion: '5.0.0', newVersion: '5.0.0', changeType: 'unchanged' },
    ];
    const result = renderTable(onlyUnchanged);
    expect(result).toContain('No dependency changes found');
  });
});

describe('groupByChangeType', () => {
  it('groups changes by their type', () => {
    const grouped = groupByChangeType(changes);
    expect(grouped['updated']).toHaveLength(1);
    expect(grouped['added']).toHaveLength(1);
    expect(grouped['removed']).toHaveLength(1);
    expect(grouped['unchanged']).toHaveLength(1);
  });

  it('returns empty object for empty input', () => {
    const grouped = groupByChangeType([]);
    expect(Object.keys(grouped)).toHaveLength(0);
  });
});
