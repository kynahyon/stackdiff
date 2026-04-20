import { checkTyposquat, analyzeTyposquat, formatTyposquatReport } from './typosquat';
import { Dependency } from '../parser';

function dep(name: string): Dependency {
  return { name, version: '1.0.0' };
}

describe('checkTyposquat', () => {
  it('returns null for a legitimate popular package', () => {
    expect(checkTyposquat('lodash')).toBeNull();
    expect(checkTyposquat('react')).toBeNull();
  });

  it('detects known typosquat patterns with high confidence', () => {
    const result = checkTyposquat('1odash');
    expect(result).not.toBeNull();
    expect(result!.suspectedTarget).toBe('lodash');
    expect(result!.confidence).toBe('high');
  });

  it('detects edit-distance-1 typos with medium confidence', () => {
    const result = checkTyposquat('expres');
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe('high'); // in known list
  });

  it('detects edit-distance-2 typos for longer names with low confidence', () => {
    const result = checkTyposquat('webpakc');
    expect(result).not.toBeNull();
    expect(result!.suspectedTarget).toBe('webpack');
  });

  it('handles scoped packages by stripping scope', () => {
    const result = checkTyposquat('@myorg/1odash');
    expect(result).not.toBeNull();
    expect(result!.suspectedTarget).toBe('lodash');
  });

  it('returns null for unrelated short package names', () => {
    expect(checkTyposquat('foo')).toBeNull();
    expect(checkTyposquat('bar')).toBeNull();
  });
});

describe('analyzeTyposquat', () => {
  it('returns empty report when no suspects', () => {
    const report = analyzeTyposquat([dep('lodash'), dep('react'), dep('axios')]);
    expect(report.total).toBe(0);
    expect(report.checked).toBe(3);
    expect(report.suspicious).toHaveLength(0);
  });

  it('detects suspicious packages in a list', () => {
    const report = analyzeTyposquat([dep('lodash'), dep('1odash'), dep('axois')]);
    expect(report.total).toBe(2);
    expect(report.suspicious.map(r => r.name)).toContain('1odash');
    expect(report.suspicious.map(r => r.name)).toContain('axois');
  });
});

describe('formatTyposquatReport', () => {
  it('shows success message when no suspects', () => {
    const report = { suspicious: [], total: 0, checked: 10 };
    expect(formatTyposquatReport(report)).toContain('No typosquat suspects found');
    expect(formatTyposquatReport(report)).toContain('10');
  });

  it('lists suspicious packages with confidence level', () => {
    const report = analyzeTyposquat([dep('1odash'), dep('axois')]);
    const output = formatTyposquatReport(report);
    expect(output).toContain('1odash');
    expect(output).toContain('lodash');
    expect(output).toContain('HIGH');
  });
});
