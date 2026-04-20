import { describe, it, expect } from 'vitest';
import {
  detectNativeReason,
  analyzeNative,
  formatNativeReport,
} from './native';

describe('detectNativeReason', () => {
  it('returns null for packages with no native deps', () => {
    expect(detectNativeReason({ lodash: '^4.0.0' })).toBeNull();
  });

  it('detects node-gyp as gyp', () => {
    expect(detectNativeReason({ 'node-gyp': '^9.0.0' })).toBe('gyp');
  });

  it('detects nan', () => {
    expect(detectNativeReason({ nan: '^2.0.0' })).toBe('nan');
  });

  it('detects node-addon-api as napi', () => {
    expect(detectNativeReason({ 'node-addon-api': '^5.0.0' })).toBe('napi');
  });

  it('detects bindings', () => {
    expect(detectNativeReason({ bindings: '^1.5.0' })).toBe('bindings');
  });

  it('detects node-pre-gyp', () => {
    expect(detectNativeReason({ 'node-pre-gyp': '^0.17.0' })).toBe('node-pre-gyp');
  });

  it('returns null for empty deps', () => {
    expect(detectNativeReason({})).toBeNull();
    expect(detectNativeReason(undefined)).toBeNull();
  });
});

describe('analyzeNative', () => {
  const packages = [
    { name: 'bcrypt', version: '5.1.0', dependencies: { 'node-gyp': '^9.0.0' } },
    { name: 'sharp', version: '0.32.0', dependencies: { 'node-addon-api': '^5.0.0' } },
    { name: 'lodash', version: '4.17.21', dependencies: {} },
  ];

  it('identifies native packages', () => {
    const result = analyzeNative(packages);
    expect(result.total).toBe(2);
    expect(result.packages.map((p) => p.name)).toEqual(['bcrypt', 'sharp']);
  });

  it('assigns correct risk levels', () => {
    const result = analyzeNative(packages);
    expect(result.packages[0].riskLevel).toBe('high');
    expect(result.packages[1].riskLevel).toBe('low');
  });

  it('counts risk levels', () => {
    const result = analyzeNative(packages);
    expect(result.riskCounts['high']).toBe(1);
    expect(result.riskCounts['low']).toBe(1);
  });

  it('returns empty result when no native packages', () => {
    const result = analyzeNative([{ name: 'lodash', version: '4.17.21', dependencies: {} }]);
    expect(result.total).toBe(0);
    expect(result.packages).toHaveLength(0);
  });
});

describe('formatNativeReport', () => {
  it('shows clean message when no native deps', () => {
    const output = formatNativeReport({ total: 0, packages: [], riskCounts: {} });
    expect(output).toContain('No native addon');
  });

  it('lists native packages with risk icons', () => {
    const output = formatNativeReport({
      total: 1,
      packages: [{ name: 'bcrypt', version: '5.1.0', reason: 'gyp', riskLevel: 'high' }],
      riskCounts: { high: 1 },
    });
    expect(output).toContain('bcrypt@5.1.0');
    expect(output).toContain('🔴');
    expect(output).toContain('gyp');
  });
});
