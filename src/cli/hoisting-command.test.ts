import { parseHoistingArgs } from './hoisting-command';

describe('parseHoistingArgs', () => {
  it('returns defaults when no args given', () => {
    const args = parseHoistingArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.showAll).toBe(false);
  });

  it('parses --lockfile flag', () => {
    const args = parseHoistingArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseHoistingArgs(['-l', 'custom.lock']);
    expect(args.lockfile).toBe('custom.lock');
  });

  it('parses --format json', () => {
    const args = parseHoistingArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses --all flag', () => {
    const args = parseHoistingArgs(['--all']);
    expect(args.showAll).toBe(true);
  });

  it('treats positional arg as lockfile path', () => {
    const args = parseHoistingArgs(['my-lock.json']);
    expect(args.lockfile).toBe('my-lock.json');
  });

  it('ignores unknown format values', () => {
    const args = parseHoistingArgs(['--format', 'csv']);
    expect(args.format).toBe('text');
  });
});
