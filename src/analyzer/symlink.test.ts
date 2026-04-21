import {
  detectSymlinkStatus,
  extractResolvedPath,
  analyzeSymlinks,
  formatSymlinkReport,
} from './symlink';
import { Dependency } from '../parser';

const makeDep = (name: string, version: string, resolved?: string): Dependency => ({
  name,
  version,
  resolved,
  dependencies: {},
});

describe('detectSymlinkStatus', () => {
  it('returns symlinked for file: resolved', () => {
    expect(detectSymlinkStatus(makeDep('a', '1.0.0', 'file:../a'))).toBe('symlinked');
  });

  it('returns symlinked for link: resolved', () => {
    expect(detectSymlinkStatus(makeDep('b', '1.0.0', 'link:../b'))).toBe('symlinked');
  });

  it('returns normal for https resolved', () => {
    expect(detectSymlinkStatus(makeDep('c', '1.0.0', 'https://registry.npmjs.org/c/-/c-1.0.0.tgz'))).toBe('normal');
  });

  it('returns unknown when no version and no resolved', () => {
    expect(detectSymlinkStatus({ name: 'x', dependencies: {} })).toBe('unknown');
  });
});

describe('extractResolvedPath', () => {
  it('strips file: prefix', () => {
    expect(extractResolvedPath(makeDep('a', '1.0.0', 'file:../packages/a'))).toBe('../packages/a');
  });

  it('strips link: prefix', () => {
    expect(extractResolvedPath(makeDep('b', '1.0.0', 'link:../packages/b'))).toBe('../packages/b');
  });

  it('returns undefined for normal resolved', () => {
    expect(extractResolvedPath(makeDep('c', '1.0.0', 'https://example.com/c.tgz'))).toBeUndefined();
  });
});

describe('analyzeSymlinks', () => {
  const deps: Dependency[] = [
    makeDep('local-a', '1.0.0', 'file:../local-a'),
    makeDep('normal-b', '2.0.0', 'https://registry.npmjs.org/normal-b/-/normal-b-2.0.0.tgz'),
    { name: 'ghost', dependencies: {} },
  ];

  it('counts correctly', () => {
    const result = analyzeSymlinks(deps);
    expect(result.symlinkCount).toBe(1);
    expect(result.normalCount).toBe(1);
    expect(result.unknownCount).toBe(1);
  });

  it('includes resolvedPath for symlinked entries', () => {
    const result = analyzeSymlinks(deps);
    const entry = result.entries.find((e) => e.name === 'local-a');
    expect(entry?.resolvedPath).toBe('../local-a');
  });
});

describe('formatSymlinkReport', () => {
  it('shows no symlinks message when none found', () => {
    const analysis = analyzeSymlinks([makeDep('a', '1.0.0', 'https://example.com/a.tgz')]);
    expect(formatSymlinkReport(analysis)).toContain('No symlinked dependencies found.');
  });

  it('lists symlinked packages', () => {
    const analysis = analyzeSymlinks([makeDep('local-x', '0.1.0', 'file:../local-x')]);
    const report = formatSymlinkReport(analysis);
    expect(report).toContain('local-x@0.1.0');
    expect(report).toContain('../local-x');
  });
});
