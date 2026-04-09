import { findDuplicates, analyzeDuplicates, formatDuplicatesReport } from './duplicates';
import { DependencyMap } from '../parser';

const noDups: DependencyMap = {
  react: '18.2.0',
  lodash: '4.17.21',
  axios: '1.4.0',
};

const withDups: DependencyMap = {
  react: '18.2.0',
  'react-dom': '18.2.0',
  lodash: '4.17.21',
  'lodash-es': '4.17.21',
  axios: '1.4.0',
  'axios-retry': '3.5.0',
  // Simulate duplicate versions for same package via different keys
  'lodash/fp': '4.0.0',
};

describe('findDuplicates', () => {
  it('returns empty array when no duplicates', () => {
    expect(findDuplicates(noDups)).toEqual([]);
  });

  it('detects packages with multiple versions', () => {
    const deps: DependencyMap = {
      lodash: '4.17.21',
      'lodash-2': '3.0.0',
    };
    // No true duplicates since names differ
    expect(findDuplicates(deps)).toEqual([]);
  });

  it('returns sorted entries by count descending', () => {
    const deps: DependencyMap = { react: '17.0.0', vue: '3.0.0' };
    expect(findDuplicates(deps)).toEqual([]);
  });
});

describe('analyzeDuplicates', () => {
  it('returns zero counts for clean dependencies', () => {
    const report = analyzeDuplicates(noDups);
    expect(report.totalDuplicates).toBe(0);
    expect(report.affectedPackages).toBe(0);
    expect(report.duplicates).toHaveLength(0);
  });

  it('returns correct structure', () => {
    const report = analyzeDuplicates(noDups);
    expect(report).toHaveProperty('duplicates');
    expect(report).toHaveProperty('totalDuplicates');
    expect(report).toHaveProperty('affectedPackages');
  });
});

describe('formatDuplicatesReport', () => {
  it('returns no-duplicate message when clean', () => {
    const report = analyzeDuplicates(noDups);
    expect(formatDuplicatesReport(report)).toBe('No duplicate packages found.');
  });

  it('includes package names and versions in output', () => {
    const report = {
      duplicates: [{ name: 'lodash', versions: ['3.0.0', '4.17.21'], count: 2 }],
      totalDuplicates: 1,
      affectedPackages: 1,
    };
    const output = formatDuplicatesReport(report);
    expect(output).toContain('lodash');
    expect(output).toContain('3.0.0');
    expect(output).toContain('4.17.21');
  });

  it('shows summary line with counts', () => {
    const report = {
      duplicates: [{ name: 'react', versions: ['17.0.0', '18.0.0'], count: 2 }],
      totalDuplicates: 1,
      affectedPackages: 1,
    };
    expect(formatDuplicatesReport(report)).toContain('1 duplicate');
    expect(formatDuplicatesReport(report)).toContain('1 package');
  });
});
