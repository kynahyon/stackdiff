import { classifyOptionalStatus, analyzeOptional, formatOptionalReport } from './optional';
import { Dependency } from '../parser';

const makeDep = (name: string, version = '1.0.0'): Dependency => ({ name, version });

describe('classifyOptionalStatus', () => {
  it('returns optional when in optionalDeps', () => {
    expect(classifyOptionalStatus('lodash', { lodash: '^4.0.0' }, {})).toBe('optional');
  });

  it('returns optional when in peerDeps', () => {
    expect(classifyOptionalStatus('react', {}, { react: '^18.0.0' })).toBe('optional');
  });

  it('returns required when not in either', () => {
    expect(classifyOptionalStatus('express', {}, {})).toBe('required');
  });
});

describe('analyzeOptional', () => {
  const deps = [makeDep('lodash'), makeDep('express'), makeDep('react'), makeDep('chalk')];
  const optionalDeps = { lodash: '^4.0.0' };
  const peerDeps = { react: '^18.0.0' };

  it('counts totals correctly', () => {
    const result = analyzeOptional(deps, optionalDeps, peerDeps);
    expect(result.total).toBe(4);
    expect(result.summary.optionalCount).toBe(2);
    expect(result.summary.requiredCount).toBe(2);
    expect(result.summary.unknownCount).toBe(0);
  });

  it('marks inOptionalDeps correctly', () => {
    const result = analyzeOptional(deps, optionalDeps, peerDeps);
    const lodash = result.optional.find((e) => e.name === 'lodash');
    expect(lodash?.inOptionalDeps).toBe(true);
    expect(lodash?.inPeerDeps).toBe(false);
  });

  it('marks inPeerDeps correctly', () => {
    const result = analyzeOptional(deps, optionalDeps, peerDeps);
    const react = result.optional.find((e) => e.name === 'react');
    expect(react?.inPeerDeps).toBe(true);
    expect(react?.inOptionalDeps).toBe(false);
  });

  it('handles empty deps', () => {
    const result = analyzeOptional([], {}, {});
    expect(result.total).toBe(0);
    expect(result.summary.optionalCount).toBe(0);
  });

  it('defaults to empty objects when no dep maps provided', () => {
    const result = analyzeOptional([makeDep('express')]);
    expect(result.summary.requiredCount).toBe(1);
  });
});

describe('formatOptionalReport', () => {
  it('includes summary line', () => {
    const analysis = analyzeOptional([makeDep('lodash')], { lodash: '^4.0.0' }, {});
    const output = formatOptionalReport(analysis);
    expect(output).toContain('Optional: 1');
    expect(output).toContain('Required: 0');
  });

  it('lists optional packages with tags', () => {
    const analysis = analyzeOptional([makeDep('lodash')], { lodash: '^4.0.0' }, {});
    const output = formatOptionalReport(analysis);
    expect(output).toContain('lodash@1.0.0');
    expect(output).toContain('optionalDependencies');
  });

  it('lists required packages', () => {
    const analysis = analyzeOptional([makeDep('express')], {}, {});
    const output = formatOptionalReport(analysis);
    expect(output).toContain('express@1.0.0');
    expect(output).toContain('Required:');
  });
});
