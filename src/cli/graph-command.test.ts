import { parseGraphArgs } from './graph-command';

describe('parseGraphArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseGraphArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.package).toBeUndefined();
  });

  it('parses --lockfile flag', () => {
    const args = parseGraphArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseGraphArgs(['-l', 'custom.lock']);
    expect(args.lockfile).toBe('custom.lock');
  });

  it('parses --format flag', () => {
    const args = parseGraphArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses -f shorthand', () => {
    const args = parseGraphArgs(['-f', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses --package flag', () => {
    const args = parseGraphArgs(['--package', 'lodash']);
    expect(args.package).toBe('lodash');
  });

  it('parses -p shorthand', () => {
    const args = parseGraphArgs(['-p', 'react']);
    expect(args.package).toBe('react');
  });

  it('parses multiple flags together', () => {
    const args = parseGraphArgs(['-l', 'lock.json', '-f', 'json', '-p', 'axios']);
    expect(args.lockfile).toBe('lock.json');
    expect(args.format).toBe('json');
    expect(args.package).toBe('axios');
  });
});
