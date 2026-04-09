import {
  buildChangelogEntry,
  generateChangelog,
  formatChangelog,
} from './changelog';
import { DiffResult } from '../diff/compare';

const mockDiff: DiffResult = {
  added: [{ name: 'lodash', version: '4.17.21' }],
  removed: [{ name: 'underscore', version: '1.13.0' }],
  updated: [
    { name: 'react', from: '17.0.0', to: '18.0.0' },
    { name: 'axios', from: '0.21.0', to: '0.27.0' },
    { name: 'chalk', from: '4.1.0', to: '4.1.2' },
  ],
  unchanged: [],
};

describe('buildChangelogEntry', () => {
  it('marks major and removed changes as breaking', () => {
    const major = buildChangelogEntry('pkg', '1.0.0', '2.0.0', 'major');
    expect(major.breaking).toBe(true);

    const removed = buildChangelogEntry('pkg', '1.0.0', undefined, 'removed');
    expect(removed.breaking).toBe(true);
  });

  it('does not mark minor or patch as breaking', () => {
    const minor = buildChangelogEntry('pkg', '1.0.0', '1.1.0', 'minor');
    expect(minor.breaking).toBe(false);

    const patch = buildChangelogEntry('pkg', '1.0.0', '1.0.1', 'patch');
    expect(patch.breaking).toBe(false);
  });

  it('uses N/A for missing versions', () => {
    const entry = buildChangelogEntry('pkg', undefined, '1.0.0', 'added');
    expect(entry.from).toBe('N/A');
  });
});

describe('generateChangelog', () => {
  it('generates entries for all change types', () => {
    const report = generateChangelog(mockDiff);
    expect(report.entries).toHaveLength(5);
  });

  it('correctly counts breaking changes', () => {
    const report = generateChangelog(mockDiff);
    // major (react) + removed (underscore) = 2 breaking
    expect(report.totalBreaking).toBe(2);
  });

  it('classifies version bumps correctly', () => {
    const report = generateChangelog(mockDiff);
    const react = report.entries.find((e) => e.package === 'react');
    expect(react?.type).toBe('major');

    const axios = report.entries.find((e) => e.package === 'axios');
    expect(axios?.type).toBe('minor');

    const chalk = report.entries.find((e) => e.package === 'chalk');
    expect(chalk?.type).toBe('patch');
  });

  it('returns a summary string', () => {
    const report = generateChangelog(mockDiff);
    expect(report.summary).toContain('5 change(s)');
    expect(report.summary).toContain('2 breaking');
  });
});

describe('formatChangelog', () => {
  it('returns a no-changes message for empty diff', () => {
    const emptyDiff: DiffResult = { added: [], removed: [], updated: [], unchanged: [] };
    const report = generateChangelog(emptyDiff);
    const output = formatChangelog(report);
    expect(output).toContain('No changes detected.');
  });

  it('includes breaking warning for breaking changes', () => {
    const report = generateChangelog(mockDiff);
    const output = formatChangelog(report);
    expect(output).toContain('⚠️ BREAKING');
  });

  it('formats as markdown with header', () => {
    const report = generateChangelog(mockDiff);
    const output = formatChangelog(report);
    expect(output).toContain('# Dependency Changelog');
  });
});
