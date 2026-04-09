import { describe, it, expect } from '@jest/globals';
import { analyzeImpact, summarizeImpact } from './impact';
import { DependencyChange } from '../diff/compare';

describe('analyzeImpact', () => {
  it('should identify breaking changes for major version updates', () => {
    const changes: DependencyChange[] = [
      {
        name: 'react',
        type: 'modified',
        oldVersion: '17.0.2',
        newVersion: '18.0.0',
      },
    ];

    const analysis = analyzeImpact(changes);

    expect(analysis).toHaveLength(1);
    expect(analysis[0].level).toBe('breaking');
    expect(analysis[0].versionChange?.semverType).toBe('major');
  });

  it('should identify minor changes for minor version updates', () => {
    const changes: DependencyChange[] = [
      {
        name: 'express',
        type: 'modified',
        oldVersion: '4.17.1',
        newVersion: '4.18.0',
      },
    ];

    const analysis = analyzeImpact(changes);

    expect(analysis[0].level).toBe('minor');
    expect(analysis[0].versionChange?.semverType).toBe('minor');
  });

  it('should identify patch changes for patch version updates', () => {
    const changes: DependencyChange[] = [
      {
        name: 'lodash',
        type: 'modified',
        oldVersion: '4.17.20',
        newVersion: '4.17.21',
      },
    ];

    const analysis = analyzeImpact(changes);

    expect(analysis[0].level).toBe('patch');
    expect(analysis[0].versionChange?.semverType).toBe('patch');
  });

  it('should mark added packages as minor impact', () => {
    const changes: DependencyChange[] = [
      {
        name: 'axios',
        type: 'added',
        newVersion: '1.0.0',
      },
    ];

    const analysis = analyzeImpact(changes);

    expect(analysis[0].level).toBe('minor');
    expect(analysis[0].changeType).toBe('added');
  });

  it('should mark removed packages as breaking', () => {
    const changes: DependencyChange[] = [
      {
        name: 'moment',
        type: 'removed',
        oldVersion: '2.29.1',
      },
    ];

    const analysis = analyzeImpact(changes);

    expect(analysis[0].level).toBe('breaking');
    expect(analysis[0].changeType).toBe('removed');
  });
});

describe('summarizeImpact', () => {
  it('should count impacts by level', () => {
    const analyses = [
      { package: 'pkg1', level: 'breaking' as const, changeType: 'removed' as const },
      { package: 'pkg2', level: 'major' as const, changeType: 'modified' as const, versionChange: { from: '1.0.0', to: '2.0.0', semverType: 'major' as const } },
      { package: 'pkg3', level: 'minor' as const, changeType: 'modified' as const, versionChange: { from: '1.0.0', to: '1.1.0', semverType: 'minor' as const } },
      { package: 'pkg4', level: 'patch' as const, changeType: 'modified' as const, versionChange: { from: '1.0.0', to: '1.0.1', semverType: 'patch' as const } },
    ];

    const summary = summarizeImpact(analyses);

    expect(summary.breaking).toBe(1);
    expect(summary.major).toBe(1);
    expect(summary.minor).toBe(1);
    expect(summary.patch).toBe(1);
    expect(summary.totalPackages).toBe(4);
  });
});
