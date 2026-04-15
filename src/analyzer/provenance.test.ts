import {
  classifyProvenance,
  analyzeProvenance,
  formatProvenanceReport,
} from './provenance';

describe('classifyProvenance', () => {
  it('returns unknown when no registry provided', () => {
    expect(classifyProvenance('pkg', {})).toBe('unknown');
  });

  it('returns verified when signature and registry present', () => {
    expect(
      classifyProvenance('pkg', { signature: 'sha512-abc', registry: 'https://registry.npmjs.org' })
    ).toBe('verified');
  });

  it('returns unverified when registry present but no signature', () => {
    expect(
      classifyProvenance('pkg', { registry: 'https://registry.npmjs.org' })
    ).toBe('unverified');
  });
});

describe('analyzeProvenance', () => {
  it('classifies regular npm packages as verified', () => {
    const report = analyzeProvenance({ react: '18.0.0', lodash: '4.17.21' });
    expect(report.total).toBe(2);
    expect(report.verified).toBe(2);
    expect(report.unverified).toBe(0);
    expect(report.unknown).toBe(0);
  });

  it('classifies file: packages as unknown', () => {
    const report = analyzeProvenance({ mylib: 'file:../mylib' });
    expect(report.unknown).toBe(1);
    expect(report.verified).toBe(0);
  });

  it('classifies link: packages as unknown', () => {
    const report = analyzeProvenance({ mylib: 'link:../mylib' });
    expect(report.unknown).toBe(1);
  });

  it('returns empty report for empty dependencies', () => {
    const report = analyzeProvenance({});
    expect(report.total).toBe(0);
    expect(report.entries).toHaveLength(0);
  });
});

describe('formatProvenanceReport', () => {
  it('shows all verified message when no issues', () => {
    const report = analyzeProvenance({ react: '18.0.0' });
    const output = formatProvenanceReport(report);
    expect(output).toContain('All packages have verified provenance.');
  });

  it('lists unverified packages', () => {
    const report = analyzeProvenance({ mylib: 'file:../mylib' });
    const output = formatProvenanceReport(report);
    expect(output).toContain('[UNKNOWN]');
    expect(output).toContain('mylib');
  });

  it('includes summary counts', () => {
    const report = analyzeProvenance({ react: '18.0.0', mylib: 'file:../mylib' });
    const output = formatProvenanceReport(report);
    expect(output).toContain('Total: 2');
    expect(output).toContain('Verified: 1');
    expect(output).toContain('Unknown: 1');
  });
});
