import { parseLifecycleArgs } from './lifecycle-command';

describe('parseLifecycleArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseLifecycleArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.minRisk).toBe('low');
    expect(args.format).toBe('text');
  });

  it('parses --lockfile flag', () => {
    const args = parseLifecycleArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseLifecycleArgs(['-l', 'pnpm-lock.yaml']);
    expect(args.lockfile).toBe('pnpm-lock.yaml');
  });

  it('parses --min-risk flag', () => {
    const args = parseLifecycleArgs(['--min-risk', 'high']);
    expect(args.minRisk).toBe('high');
  });

  it('parses --format flag', () => {
    const args = parseLifecycleArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses -f shorthand', () => {
    const args = parseLifecycleArgs(['-f', 'json']);
    expect(args.format).toBe('json');
  });

  it('treats positional arg as lockfile', () => {
    const args = parseLifecycleArgs(['custom-lock.json']);
    expect(args.lockfile).toBe('custom-lock.json');
  });

  it('handles combined flags', () => {
    const args = parseLifecycleArgs(['--min-risk', 'medium', '--format', 'json', '--lockfile', 'my.lock']);
    expect(args.minRisk).toBe('medium');
    expect(args.format).toBe('json');
    expect(args.lockfile).toBe('my.lock');
  });
});
