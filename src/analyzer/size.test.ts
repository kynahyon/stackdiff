import { analyzeSizes, estimatePackageSize, formatSizeReport } from './size';

describe('estimatePackageSize', () => {
  it('returns a positive number', () => {
    expect(estimatePackageSize('1.0.0')).toBeGreaterThan(0);
  });

  it('returns consistent values for the same input', () => {
    expect(estimatePackageSize('2.3.4')).toBe(estimatePackageSize('2.3.4'));
  });

  it('returns different values for different versions', () => {
    expect(estimatePackageSize('1.0.0')).not.toBe(estimatePackageSize('2.0.0'));
  });
});

describe('analyzeSizes', () => {
  const oldDeps = { react: '17.0.2', lodash: '4.17.21' };
  const newDeps = { react: '18.2.0', lodash: '4.17.21', axios: '1.4.0' };

  it('includes all packages from both lockfiles', () => {
    const report = analyzeSizes(oldDeps, newDeps);
    const names = report.entries.map((e) => e.name);
    expect(names).toContain('react');
    expect(names).toContain('lodash');
    expect(names).toContain('axios');
  });

  it('sets oldSize to null for added packages', () => {
    const report = analyzeSizes(oldDeps, newDeps);
    const axios = report.entries.find((e) => e.name === 'axios')!;
    expect(axios.oldSize).toBeNull();
    expect(axios.newSize).not.toBeNull();
  });

  it('computes totalDelta as difference of totals', () => {
    const report = analyzeSizes(oldDeps, newDeps);
    expect(report.totalDelta).toBe(report.totalNewSize - report.totalOldSize);
  });

  it('sorts entries by absolute delta descending', () => {
    const report = analyzeSizes(oldDeps, newDeps);
    for (let i = 1; i < report.entries.length; i++) {
      expect(Math.abs(report.entries[i - 1].delta)).toBeGreaterThanOrEqual(
        Math.abs(report.entries[i].delta)
      );
    }
  });

  it('handles removed packages with newSize null', () => {
    const report = analyzeSizes({ pkg: '1.0.0' }, {});
    const entry = report.entries.find((e) => e.name === 'pkg')!;
    expect(entry.newSize).toBeNull();
    expect(entry.delta).toBeLessThan(0);
  });

  it('returns zero delta for unchanged packages', () => {
    const report = analyzeSizes({ lodash: '4.17.21' }, { lodash: '4.17.21' });
    const entry = report.entries.find((e) => e.name === 'lodash')!;
    expect(entry.delta).toBe(0);
  });
});

describe('formatSizeReport', () => {
  it('includes header and total line', () => {
    const report = analyzeSizes({ react: '17.0.2' }, { react: '18.2.0' });
    const output = formatSizeReport(report);
    expect(output).toContain('Size Impact Report');
    expect(output).toContain('Total:');
  });

  it('includes package names', () => {
    const report = analyzeSizes({ react: '17.0.2' }, { react: '18.2.0' });
    const output = formatSizeReport(report);
    expect(output).toContain('react');
  });
});
