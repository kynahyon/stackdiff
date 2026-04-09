import { describe, it, expect } from '@jest/globals';
import { analyzeSecurityRisks } from './security';
import { DependencyChange } from '../diff/compare';

describe('analyzeSecurityRisks', () => {
  it('should detect major version downgrades', () => {
    const changes: DependencyChange[] = [
      {
        name: 'lodash',
        type: 'modified',
        oldVersion: '4.17.21',
        newVersion: '3.10.1',
      },
    ];

    const report = analyzeSecurityRisks(changes);

    expect(report.issues).toHaveLength(1);
    expect(report.issues[0].severity).toBe('high');
    expect(report.issues[0].type).toBe('major-downgrade');
    expect(report.issues[0].package).toBe('lodash');
    expect(report.summary.high).toBe(1);
  });

  it('should detect pre-release versions', () => {
    const changes: DependencyChange[] = [
      {
        name: 'react',
        type: 'added',
        newVersion: '18.0.0-beta.2',
      },
      {
        name: 'vue',
        type: 'modified',
        oldVersion: '3.0.0',
        newVersion: '3.1.0-alpha.1',
      },
    ];

    const report = analyzeSecurityRisks(changes);

    expect(report.issues).toHaveLength(2);
    expect(report.issues.every(i => i.type === 'pre-release')).toBe(true);
    expect(report.summary.medium).toBe(2);
  });

  it('should detect removed packages', () => {
    const changes: DependencyChange[] = [
      {
        name: 'moment',
        type: 'removed',
        oldVersion: '2.29.1',
      },
    ];

    const report = analyzeSecurityRisks(changes);

    expect(report.issues).toHaveLength(1);
    expect(report.issues[0].severity).toBe('low');
    expect(report.issues[0].type).toBe('outdated-major');
    expect(report.summary.low).toBe(1);
  });

  it('should handle multiple security issues', () => {
    const changes: DependencyChange[] = [
      { name: 'pkg1', type: 'modified', oldVersion: '5.0.0', newVersion: '4.0.0' },
      { name: 'pkg2', type: 'added', newVersion: '1.0.0-rc.1' },
      { name: 'pkg3', type: 'removed', oldVersion: '2.0.0' },
    ];

    const report = analyzeSecurityRisks(changes);

    expect(report.issues).toHaveLength(3);
    expect(report.summary.high).toBe(1);
    expect(report.summary.medium).toBe(1);
    expect(report.summary.low).toBe(1);
  });

  it('should return empty report for safe changes', () => {
    const changes: DependencyChange[] = [
      { name: 'express', type: 'modified', oldVersion: '4.17.1', newVersion: '4.18.0' },
      { name: 'typescript', type: 'added', newVersion: '5.0.0' },
    ];

    const report = analyzeSecurityRisks(changes);

    expect(report.issues).toHaveLength(0);
    expect(report.summary.critical).toBe(0);
    expect(report.summary.high).toBe(0);
  });
});
