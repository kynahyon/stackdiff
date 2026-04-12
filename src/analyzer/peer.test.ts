import {
  checkPeerCompatibility,
  analyzePeerDependencies,
  formatPeerReport,
  extractPeerDeps,
} from './peer';

const mockDeps = {
  react: { version: '17.0.2' },
  'react-dom': { version: '17.0.2' },
  'some-ui-lib': {
    version: '3.1.0',
    peerDependencies: { react: '^17.0.0', 'react-dom': '^17.0.0' },
  },
  'legacy-lib': {
    version: '1.0.0',
    peerDependencies: { react: '^16.0.0' },
  },
  'orphan-lib': {
    version: '2.0.0',
    peerDependencies: { lodash: '^4.0.0' },
  },
} as any;

describe('extractPeerDeps', () => {
  it('returns peer dependencies for a package', () => {
    const peers = extractPeerDeps('some-ui-lib', mockDeps);
    expect(peers).toEqual({ react: '^17.0.0', 'react-dom': '^17.0.0' });
  });

  it('returns empty object if no peer deps', () => {
    const peers = extractPeerDeps('react', mockDeps);
    expect(peers).toEqual({});
  });

  it('returns empty object for unknown package', () => {
    const peers = extractPeerDeps('unknown', mockDeps);
    expect(peers).toEqual({});
  });
});

describe('checkPeerCompatibility', () => {
  it('returns true for matching major version', () => {
    expect(checkPeerCompatibility('^17.0.0', '17.0.2')).toBe(true);
  });

  it('returns false for mismatched major version', () => {
    expect(checkPeerCompatibility('^16.0.0', '17.0.2')).toBe(false);
  });

  it('returns false for null installed version', () => {
    expect(checkPeerCompatibility('^17.0.0', null)).toBe(false);
  });

  it('returns true for wildcard range', () => {
    expect(checkPeerCompatibility('*', '17.0.2')).toBe(true);
  });
});

describe('analyzePeerDependencies', () => {
  it('detects satisfied peer deps', () => {
    const result = analyzePeerDependencies(mockDeps);
    expect(result.satisfied).toBe(2);
  });

  it('detects version conflicts', () => {
    const result = analyzePeerDependencies(mockDeps);
    const legacy = result.conflicts.find(c => c.requiredBy === 'legacy-lib');
    expect(legacy).toBeDefined();
    expect(legacy?.compatible).toBe(false);
  });

  it('detects missing peer deps', () => {
    const result = analyzePeerDependencies(mockDeps);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing[0]).toContain('lodash');
  });

  it('counts total peer dep requirements', () => {
    const result = analyzePeerDependencies(mockDeps);
    expect(result.total).toBe(5);
  });
});

describe('formatPeerReport', () => {
  it('includes satisfied count', () => {
    const result = analyzePeerDependencies(mockDeps);
    const report = formatPeerReport(result);
    expect(report).toContain('Satisfied:');
  });

  it('lists conflicts', () => {
    const result = analyzePeerDependencies(mockDeps);
    const report = formatPeerReport(result);
    expect(report).toContain('legacy-lib');
  });

  it('shows clean message when no conflicts', () => {
    const report = formatPeerReport({ conflicts: [], missing: [], satisfied: 3, total: 3 });
    expect(report).toContain('No peer dependency conflicts found.');
  });
});
