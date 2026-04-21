import { parseRegistryArgs } from './registry-command';

describe('parseRegistryArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseRegistryArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.showCustomOnly).toBe(false);
  });

  it('parses --lockfile flag', () => {
    const args = parseRegistryArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseRegistryArgs(['-l', 'my-lock.json']);
    expect(args.lockfile).toBe('my-lock.json');
  });

  it('parses --format json', () => {
    const args = parseRegistryArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses -f text', () => {
    const args = parseRegistryArgs(['-f', 'text']);
    expect(args.format).toBe('text');
  });

  it('ignores unknown format values', () => {
    const args = parseRegistryArgs(['--format', 'xml']);
    expect(args.format).toBe('text');
  });

  it('parses --custom-only flag', () => {
    const args = parseRegistryArgs(['--custom-only']);
    expect(args.showCustomOnly).toBe(true);
  });

  it('treats positional arg as lockfile', () => {
    const args = parseRegistryArgs(['custom-lock.json']);
    expect(args.lockfile).toBe('custom-lock.json');
  });

  it('handles combined flags', () => {
    const args = parseRegistryArgs(['-l', 'lock.json', '--format', 'json', '--custom-only']);
    expect(args.lockfile).toBe('lock.json');
    expect(args.format).toBe('json');
    expect(args.showCustomOnly).toBe(true);
  });
});
