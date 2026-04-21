import {
  classifyShrinkwrapStatus,
  analyzeShrinkwrap,
  formatShrinkwrapReport,
} from './shrinkwrap';
import { Dependency } from '../parser';

const dep = (name: string, version: string): Dependency => ({
  name,
  version,
  type: 'dependency',
});

describe('classifyShrinkwrapStatus', () => {
  it('returns locked when versions match', () => {
    expect(classifyShrinkwrapStatus('1.2.3', '1.2.3')).toBe('locked');
  });

  it('returns locked when declared has range prefix', () => {
    expect(classifyShrinkwrapStatus('1.2.3', '^1.2.3')).toBe('locked');
  });

  it('returns drifted when versions differ', () => {
    expect(classifyShrinkwrapStatus('1.2.4', '1.2.3')).toBe('drifted');
  });

  it('returns extra when declared version is undefined', () => {
    expect(classifyShrinkwrapStatus('1.2.3', undefined)).toBe('extra');
  });

  it('returns missing when resolved version is empty', () => {
    expect(classifyShrinkwrapStatus('', '1.2.3')).toBe('missing');
  });
});

describe('analyzeShrinkwrap', () => {
  const resolved = [
    dep('react', '18.0.0'),
    dep('lodash', '4.17.21'),
    dep('extra-pkg', '1.0.0'),
  ];

  const declared = [
    dep('react', '18.0.0'),
    dep('lodash', '4.17.20'),
    dep('missing-pkg', '2.0.0'),
  ];

  it('counts locked, drifted, missing, extra correctly', () => {
    const result = analyzeShrinkwrap(resolved, declared);
    expect(result.lockedCount).toBe(1);
    expect(result.driftedCount).toBe(1);
    expect(result.missingCount).toBe(1);
    expect(result.extraCount).toBe(1);
  });

  it('marks extra-pkg as extra', () => {
    const result = analyzeShrinkwrap(resolved, declared);
    const entry = result.entries.find((e) => e.name === 'extra-pkg');
    expect(entry?.status).toBe('extra');
  });

  it('marks missing-pkg as missing', () => {
    const result = analyzeShrinkwrap(resolved, declared);
    const entry = result.entries.find((e) => e.name === 'missing-pkg');
    expect(entry?.status).toBe('missing');
  });

  it('returns empty analysis for empty inputs', () => {
    const result = analyzeShrinkwrap([], []);
    expect(result.entries).toHaveLength(0);
    expect(result.lockedCount).toBe(0);
  });
});

describe('formatShrinkwrapReport', () => {
  it('includes summary counts', () => {
    const analysis = analyzeShrinkwrap(
      [dep('react', '18.0.0')],
      [dep('react', '18.0.0')]
    );
    const report = formatShrinkwrapReport(analysis);
    expect(report).toContain('Locked:  1');
    expect(report).toContain('Drifted: 0');
  });

  it('lists drifted packages in issues section', () => {
    const analysis = analyzeShrinkwrap(
      [dep('lodash', '4.17.21')],
      [dep('lodash', '4.17.20')]
    );
    const report = formatShrinkwrapReport(analysis);
    expect(report).toContain('[DRIFTED]');
    expect(report).toContain('lodash');
  });
});
