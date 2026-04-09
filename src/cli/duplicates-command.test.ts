import { parseDuplicatesArgs } from './duplicates-command';

describe('parseDuplicatesArgs', () => {
  it('uses default lockfile when no args provided', () => {
    const args = parseDuplicatesArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.json).toBe(false);
  });

  it('parses custom lockfile path', () => {
    const args = parseDuplicatesArgs(['yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses --json flag', () => {
    const args = parseDuplicatesArgs(['--json']);
    expect(args.json).toBe(true);
  });

  it('parses both lockfile and --json flag', () => {
    const args = parseDuplicatesArgs(['custom-lock.json', '--json']);
    expect(args.lockfile).toBe('custom-lock.json');
    expect(args.json).toBe(true);
  });

  it('handles --json before lockfile path', () => {
    const args = parseDuplicatesArgs(['--json', 'my-lock.json']);
    expect(args.json).toBe(true);
    expect(args.lockfile).toBe('my-lock.json');
  });
});
