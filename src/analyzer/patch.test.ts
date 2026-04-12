import {
  classifyPatchChange,
  countPatchDistance,
  analyzePatchChanges,
  formatPatchReport,
} from './patch';
import { DiffResult } from '../diff/compare';

describe('classifyPatchChange', () => {
  it('detects patch change', () => {
    expect(classifyPatchChange('1.0.0', '1.0.5')).toEqual({
      isPatch: true,
      isMinor: false,
      isMajor: false,
    });
  });

  it('detects minor change', () => {
    expect(classifyPatchChange('1.0.0', '1.2.0')).toEqual({
      isPatch: false,
      isMinor: true,
      isMajor: false,
    });
  });

  it('detects major change', () => {
    expect(classifyPatchChange('1.0.0', '2.0.0')).toEqual({
      isPatch: false,
      isMinor: false,
      isMajor: true,
    });
  });

  it('handles version prefixes', () => {
    expect(classifyPatchChange('^1.0.0', '^1.0.3')).toEqual({
      isPatch: true,
      isMinor: false,
      isMajor: false,
    });
  });

  it('returns all false for non-parseable versions', () => {
    expect(classifyPatchChange('latest', 'next')).toEqual({
      isPatch: false,
      isMinor: false,
      isMajor: false,
    });
  });
});

describe('countPatchDistance', () => {
  it('returns patch distance', () => {
    expect(countPatchDistance('1.0.0', '1.0.4')).toBe(4);
  });

  it('returns 0 for non-patch changes', () => {
    expect(countPatchDistance('1.0.0', '1.1.0')).toBe(0);
  });
});

describe('analyzePatchChanges', () => {
  const diff: DiffResult[] = [
    { name: 'lodash', type: 'updated', from: '4.17.20', to: '4.17.21' },
    { name: 'react', type: 'updated', from: '17.0.0', to: '18.0.0' },
    { name: 'axios', type: 'updated', from: '0.21.0', to: '0.22.0' },
    { name: 'chalk', type: 'added', to: '5.0.0' },
  ];

  it('correctly counts patch/minor/major', () => {
    const result = analyzePatchChanges(diff);
    expect(result.totalPatches).toBe(1);
    expect(result.totalMinor).toBe(1);
    expect(result.totalMajor).toBe(1);
  });

  it('lists safe auto-update packages', () => {
    const result = analyzePatchChanges(diff);
    expect(result.safeToAutoUpdate).toContain('lodash');
    expect(result.safeToAutoUpdate).not.toContain('react');
  });

  it('ignores non-updated entries', () => {
    const result = analyzePatchChanges(diff);
    expect(result.patches.find((p) => p.name === 'chalk')).toBeUndefined();
  });
});

describe('formatPatchReport', () => {
  it('includes summary counts and package details', () => {
    const summary = analyzePatchChanges([
      { name: 'lodash', type: 'updated', from: '4.17.20', to: '4.17.21' },
    ]);
    const report = formatPatchReport(summary);
    expect(report).toContain('Patch updates: 1');
    expect(report).toContain('[PATCH] lodash');
    expect(report).toContain('Safe to auto-update');
  });
});
