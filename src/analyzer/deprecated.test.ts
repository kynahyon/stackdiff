import { classifyDeprecation, analyzeDeprecated, formatDeprecatedReport } from './deprecated';
import { DependencyMap } from '../parser';

describe('classifyDeprecation', () => {
  it('returns deprecated for known deprecated packages', () => {
    expect(classifyDeprecation('request')).toBe('deprecated');
    expect(classifyDeprecation('node-uuid')).toBe('deprecated');
    expect(classifyDeprecation('jade')).toBe('deprecated');
  });

  it('returns unknown for unrecognized packages', () => {
    expect(classifyDeprecation('express')).toBe('unknown');
    expect(classifyDeprecation('lodash')).toBe('unknown');
  });
});

describe('analyzeDeprecated', () => {
  const deps: DependencyMap = {
    request: '2.88.2',
    express: '4.18.0',
    'node-uuid': '1.4.8',
    lodash: '4.17.21',
    jade: '1.11.0',
  };

  it('correctly categorizes deprecated packages', () => {
    const result = analyzeDeprecated(deps);
    expect(result.deprecated).toHaveLength(3);
    expect(result.deprecated.map(p => p.name)).toContain('request');
    expect(result.deprecated.map(p => p.name)).toContain('node-uuid');
    expect(result.deprecated.map(p => p.name)).toContain('jade');
  });

  it('sets totalChecked to number of deps', () => {
    const result = analyzeDeprecated(deps);
    expect(result.totalChecked).toBe(5);
  });

  it('includes deprecation message for known packages', () => {
    const result = analyzeDeprecated(deps);
    const req = result.deprecated.find(p => p.name === 'request');
    expect(req?.message).toContain('node-fetch');
  });

  it('puts unrecognized packages in unknown', () => {
    const result = analyzeDeprecated(deps);
    expect(result.unknown.map(p => p.name)).toContain('express');
    expect(result.unknown.map(p => p.name)).toContain('lodash');
  });

  it('handles empty dependency map', () => {
    const result = analyzeDeprecated({});
    expect(result.deprecated).toHaveLength(0);
    expect(result.totalChecked).toBe(0);
  });
});

describe('formatDeprecatedReport', () => {
  it('shows no deprecated message when none found', () => {
    const result = analyzeDeprecated({ express: '4.18.0' });
    const report = formatDeprecatedReport(result);
    expect(report).toContain('No known deprecated packages found.');
  });

  it('lists deprecated packages with messages', () => {
    const result = analyzeDeprecated({ request: '2.88.2', jade: '1.11.0' });
    const report = formatDeprecatedReport(result);
    expect(report).toContain('request');
    expect(report).toContain('jade');
    expect(report).toContain('node-fetch');
  });

  it('includes count of deprecated packages', () => {
    const result = analyzeDeprecated({ request: '2.88.2' });
    const report = formatDeprecatedReport(result);
    expect(report).toContain('Deprecated: 1');
  });
});
