import { parsePeerArgs } from './peer-command';

describe('parsePeerArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parsePeerArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.failOnConflict).toBe(false);
  });

  it('parses --lockfile flag', () => {
    const args = parsePeerArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parsePeerArgs(['-l', 'custom.lock']);
    expect(args.lockfile).toBe('custom.lock');
  });

  it('parses --format json', () => {
    const args = parsePeerArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('ignores unknown format values', () => {
    const args = parsePeerArgs(['--format', 'xml']);
    expect(args.format).toBe('text');
  });

  it('parses --fail-on-conflict flag', () => {
    const args = parsePeerArgs(['--fail-on-conflict']);
    expect(args.failOnConflict).toBe(true);
  });

  it('treats positional arg as lockfile path', () => {
    const args = parsePeerArgs(['my-lock.json']);
    expect(args.lockfile).toBe('my-lock.json');
  });

  it('handles combined flags', () => {
    const args = parsePeerArgs(['--format', 'json', '--fail-on-conflict', '-l', 'lock.json']);
    expect(args.format).toBe('json');
    expect(args.failOnConflict).toBe(true);
    expect(args.lockfile).toBe('lock.json');
  });
});
