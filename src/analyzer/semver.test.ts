import { parseConstraint, isCompatible, constraintSummary } from './semver';

describe('parseConstraint', () => {
  it('parses exact version', () => {
    const result = parseConstraint('1.2.3');
    expect(result.type).toBe('exact');
    expect(result.major).toBe(1);
    expect(result.minor).toBe(2);
    expect(result.patch).toBe(3);
  });

  it('parses patch range with tilde', () => {
    const result = parseConstraint('~2.0.1');
    expect(result.type).toBe('patch');
    expect(result.major).toBe(2);
  });

  it('parses minor range with caret', () => {
    const result = parseConstraint('^3.4.5');
    expect(result.type).toBe('minor');
    expect(result.major).toBe(3);
    expect(result.minor).toBe(4);
  });

  it('parses wildcard as major', () => {
    expect(parseConstraint('*').type).toBe('major');
    expect(parseConstraint('x').type).toBe('major');
  });

  it('parses range expression', () => {
    const result = parseConstraint('>=1.0.0 <2.0.0');
    expect(result.type).toBe('range');
  });

  it('returns unknown for unrecognized format', () => {
    const result = parseConstraint('latest');
    expect(result.type).toBe('unknown');
  });
});

describe('isCompatible', () => {
  it('exact match returns true for same version', () => {
    const c = parseConstraint('1.2.3');
    expect(isCompatible(c, '1.2.3')).toBe(true);
  });

  it('exact match returns false for different version', () => {
    const c = parseConstraint('1.2.3');
    expect(isCompatible(c, '1.2.4')).toBe(false);
  });

  it('patch constraint allows higher patch', () => {
    const c = parseConstraint('~1.2.0');
    expect(isCompatible(c, '1.2.5')).toBe(true);
    expect(isCompatible(c, '1.3.0')).toBe(false);
  });

  it('minor constraint allows higher minor', () => {
    const c = parseConstraint('^1.0.0');
    expect(isCompatible(c, '1.5.0')).toBe(true);
    expect(isCompatible(c, '2.0.0')).toBe(false);
  });

  it('major wildcard always compatible', () => {
    const c = parseConstraint('*');
    expect(isCompatible(c, '99.0.0')).toBe(true);
  });
});

describe('constraintSummary', () => {
  it('counts constraint types correctly', () => {
    const constraints = [
      parseConstraint('1.0.0'),
      parseConstraint('^2.0.0'),
      parseConstraint('~1.5.0'),
      parseConstraint('^3.0.0'),
      parseConstraint('*'),
    ];
    const summary = constraintSummary(constraints);
    expect(summary.exact).toBe(1);
    expect(summary.minor).toBe(2);
    expect(summary.patch).toBe(1);
    expect(summary.major).toBe(1);
  });
});
