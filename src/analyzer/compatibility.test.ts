import {
  classifyNodeRange,
  isCompatibleWithRuntime,
  analyzeCompatibility,
  formatCompatibilityReport,
} from './compatibility';
import { Dependency } from '../parser';

const makeDep = (name: string, version: string, nodeEngines?: string): Dependency =>
  ({ name, version, ...(nodeEngines ? { engines: { node: nodeEngines } } : {}) } as any);

describe('classifyNodeRange', () => {
  it('returns unknown for undefined', () => {
    expect(classifyNodeRange(undefined)).toBe('unknown');
  });

  it('classifies legacy range', () => {
    expect(classifyNodeRange('>=0.10')).toBe('legacy');
    expect(classifyNodeRange('>=6.0.0')).toBe('legacy');
  });

  it('classifies lts range', () => {
    expect(classifyNodeRange('>=14.0.0')).toBe('lts');
    expect(classifyNodeRange('>=18.0.0')).toBe('lts');
  });

  it('classifies current range', () => {
    expect(classifyNodeRange('>=21.0.0')).toBe('current');
  });

  it('returns unknown for unrecognized pattern', () => {
    expect(classifyNodeRange('^12.0.0')).toBe('unknown');
  });
});

describe('isCompatibleWithRuntime', () => {
  it('returns true when no engines specified', () => {
    expect(isCompatibleWithRuntime(undefined, '18.0.0')).toBe(true);
  });

  it('returns true when runtime meets minimum', () => {
    expect(isCompatibleWithRuntime('>=14.0.0', '18.0.0')).toBe(true);
  });

  it('returns false when runtime is below minimum', () => {
    expect(isCompatibleWithRuntime('>=20.0.0', '18.0.0')).toBe(false);
  });

  it('handles v-prefixed runtime version', () => {
    expect(isCompatibleWithRuntime('>=16.0.0', 'v18.0.0')).toBe(true);
  });
});

describe('analyzeCompatibility', () => {
  const deps = [
    makeDep('express', '4.18.0', '>=14.0.0'),
    makeDep('legacy-pkg', '1.0.0', '>=0.10.0'),
    makeDep('future-pkg', '2.0.0', '>=22.0.0'),
    makeDep('no-engine', '3.0.0'),
  ];

  it('counts incompatible packages correctly', () => {
    const report = analyzeCompatibility(deps, '18.0.0');
    expect(report.incompatibleCount).toBe(1);
  });

  it('counts unknown engine packages', () => {
    const report = analyzeCompatibility(deps, '18.0.0');
    expect(report.unknownCount).toBe(1);
  });

  it('marks compatible packages correctly', () => {
    const report = analyzeCompatibility(deps, '18.0.0');
    const express = report.results.find((r) => r.name === 'express');
    expect(express?.compatible).toBe(true);
  });

  it('includes reason for incompatible packages', () => {
    const report = analyzeCompatibility(deps, '18.0.0');
    const future = report.results.find((r) => r.name === 'future-pkg');
    expect(future?.reason).toMatch(/Requires Node/);
  });
});

describe('formatCompatibilityReport', () => {
  it('shows success message when all compatible', () => {
    const deps = [makeDep('ok-pkg', '1.0.0', '>=14.0.0')];
    const report = analyzeCompatibility(deps, '18.0.0');
    const output = formatCompatibilityReport(report);
    expect(output).toContain('✅');
  });

  it('lists incompatible packages', () => {
    const deps = [makeDep('bad-pkg', '1.0.0', '>=22.0.0')];
    const report = analyzeCompatibility(deps, '18.0.0');
    const output = formatCompatibilityReport(report);
    expect(output).toContain('bad-pkg');
    expect(output).toContain('Incompatible Packages');
  });
});
