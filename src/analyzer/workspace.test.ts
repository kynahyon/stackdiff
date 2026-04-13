import { analyzeWorkspace, formatWorkspaceReport, WorkspacePackage } from './workspace';

const pkgA: WorkspacePackage = {
  name: 'app',
  version: '1.0.0',
  path: 'packages/app',
  dependencies: { react: '18.0.0', lodash: '4.17.21' },
};

const pkgB: WorkspacePackage = {
  name: 'lib',
  version: '1.0.0',
  path: 'packages/lib',
  dependencies: { react: '18.0.0', lodash: '4.17.20' },
};

const pkgC: WorkspacePackage = {
  name: 'utils',
  version: '1.0.0',
  path: 'packages/utils',
  dependencies: { lodash: '4.17.21' },
};

describe('analyzeWorkspace', () => {
  it('detects no conflicts when all versions match', () => {
    const result = analyzeWorkspace([pkgA, pkgC]);
    expect(result.totalConflicts).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  it('detects version conflict for lodash', () => {
    const result = analyzeWorkspace([pkgA, pkgB]);
    expect(result.totalConflicts).toBe(1);
    expect(result.conflicts[0].packageName).toBe('lodash');
  });

  it('groups workspaces by version correctly', () => {
    const result = analyzeWorkspace([pkgA, pkgB, pkgC]);
    const lodashConflict = result.conflicts.find((c) => c.packageName === 'lodash');
    expect(lodashConflict).toBeDefined();
    expect(lodashConflict!.versions['4.17.21']).toContain('app');
    expect(lodashConflict!.versions['4.17.20']).toContain('lib');
  });

  it('returns correct package count', () => {
    const result = analyzeWorkspace([pkgA, pkgB, pkgC]);
    expect(result.totalPackages).toBe(3);
  });

  it('handles empty workspace', () => {
    const result = analyzeWorkspace([]);
    expect(result.totalPackages).toBe(0);
    expect(result.totalConflicts).toBe(0);
  });
});

describe('formatWorkspaceReport', () => {
  it('reports no conflicts message when clean', () => {
    const result = analyzeWorkspace([pkgA, pkgC]);
    const report = formatWorkspaceReport(result);
    expect(report).toContain('No version conflicts found.');
  });

  it('lists conflict details', () => {
    const result = analyzeWorkspace([pkgA, pkgB]);
    const report = formatWorkspaceReport(result);
    expect(report).toContain('lodash');
    expect(report).toContain('4.17.21');
    expect(report).toContain('4.17.20');
  });
});
