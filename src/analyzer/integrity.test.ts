import { classifyIntegrity, detectAlgorithm, analyzeIntegrity, formatIntegrityReport } from './integrity';
import { Dependency } from '../parser';

const makeDep = (name: string, version: string, integrity?: string): Dependency =>
  ({ name, version, ...(integrity !== undefined ? { integrity } : {}) } as any);

describe('detectAlgorithm', () => {
  it('extracts sha512', () => {
    expect(detectAlgorithm('sha512-abc123==')).toBe('sha512');
  });

  it('extracts sha1', () => {
    expect(detectAlgorithm('sha1-xyz==')).toBe('sha1');
  });

  it('returns undefined for malformed string', () => {
    expect(detectAlgorithm('notvalid')).toBeUndefined();
  });
});

describe('classifyIntegrity', () => {
  it('returns missing when undefined', () => {
    expect(classifyIntegrity(undefined)).toBe('missing');
  });

  it('returns malformed for garbage string', () => {
    expect(classifyIntegrity('not-a-hash!')).toBe('malformed');
  });

  it('returns weak for sha1', () => {
    expect(classifyIntegrity('sha1-dGVzdA==')).toBe('weak');
  });

  it('returns valid for sha512', () => {
    expect(classifyIntegrity('sha512-dGVzdA==')).toBe('valid');
  });

  it('returns malformed when no algorithm prefix matches', () => {
    expect(classifyIntegrity('-dGVzdA==')).toBe('malformed');
  });
});

describe('analyzeIntegrity', () => {
  const deps = [
    makeDep('lodash', '4.17.21', 'sha512-dGVzdA=='),
    makeDep('axios', '1.4.0', 'sha1-dGVzdA=='),
    makeDep('react', '18.0.0'),
    makeDep('vue', '3.0.0', 'bad!hash'),
  ];

  it('counts statuses correctly', () => {
    const report = analyzeIntegrity(deps);
    expect(report.valid).toBe(1);
    expect(report.weak).toBe(1);
    expect(report.missing).toBe(1);
    expect(report.malformed).toBe(1);
  });

  it('includes all entries', () => {
    const report = analyzeIntegrity(deps);
    expect(report.entries).toHaveLength(4);
  });
});

describe('formatIntegrityReport', () => {
  it('shows all-clear message when all valid', () => {
    const report = analyzeIntegrity([makeDep('lodash', '4.17.21', 'sha512-dGVzdA==')]);
    const output = formatIntegrityReport(report);
    expect(output).toContain('All packages have strong integrity hashes.');
  });

  it('renders table rows for issues', () => {
    const report = analyzeIntegrity([makeDep('axios', '1.4.0', 'sha1-dGVzdA=='), makeDep('react', '18.0.0')]);
    const output = formatIntegrityReport(report);
    expect(output).toContain('axios');
    expect(output).toContain('react');
    expect(output).toContain('weak');
    expect(output).toContain('missing');
  });
});
