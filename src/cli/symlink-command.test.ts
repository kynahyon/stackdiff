import { parseSymlinkArgs } from './symlink-command';

describe('parseSymlinkArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseSymlinkArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.onlySymlinked).toBe(false);
  });

  it('parses --lockfile flag', () => {
    const args = parseSymlinkArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseSymlinkArgs(['-l', 'custom.lock']);
    expect(args.lockfile).toBe('custom.lock');
  });

  it('parses --format json', () => {
    const args = parseSymlinkArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses -f shorthand', () => {
    const args = parseSymlinkArgs(['-f', 'text']);
    expect(args.format).toBe('text');
  });

  it('parses --only-symlinked flag', () => {
    const args = parseSymlinkArgs(['--only-symlinked']);
    expect(args.onlySymlinked).toBe(true);
  });

  it('treats positional arg as lockfile path', () => {
    const args = parseSymlinkArgs(['my-lock.json']);
    expect(args.lockfile).toBe('my-lock.json');
  });

  it('ignores unknown format and keeps default', () => {
    const args = parseSymlinkArgs(['--format', 'xml']);
    expect(args.format).toBe('text');
  });
});
