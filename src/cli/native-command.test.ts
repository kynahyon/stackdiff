import { describe, it, expect } from 'vitest';
import { parseNativeArgs } from './native-command';

describe('parseNativeArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseNativeArgs([]);
    expect(args.lockfile).toBe('package-lock.json');
    expect(args.format).toBe('text');
    expect(args.minRisk).toBe('low');
  });

  it('parses --lockfile flag', () => {
    const args = parseNativeArgs(['--lockfile', 'yarn.lock']);
    expect(args.lockfile).toBe('yarn.lock');
  });

  it('parses -l shorthand', () => {
    const args = parseNativeArgs(['-l', 'custom.lock']);
    expect(args.lockfile).toBe('custom.lock');
  });

  it('parses --format json', () => {
    const args = parseNativeArgs(['--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('ignores invalid format values', () => {
    const args = parseNativeArgs(['--format', 'xml']);
    expect(args.format).toBe('text');
  });

  it('parses --min-risk medium', () => {
    const args = parseNativeArgs(['--min-risk', 'medium']);
    expect(args.minRisk).toBe('medium');
  });

  it('parses --min-risk high', () => {
    const args = parseNativeArgs(['--min-risk', 'high']);
    expect(args.minRisk).toBe('high');
  });

  it('ignores invalid min-risk values', () => {
    const args = parseNativeArgs(['--min-risk', 'critical']);
    expect(args.minRisk).toBe('low');
  });

  it('treats positional arg as lockfile path', () => {
    const args = parseNativeArgs(['my-lockfile.json']);
    expect(args.lockfile).toBe('my-lockfile.json');
  });

  it('handles combined flags', () => {
    const args = parseNativeArgs(['--format', 'json', '--min-risk', 'high', '-l', 'lock.json']);
    expect(args.format).toBe('json');
    expect(args.minRisk).toBe('high');
    expect(args.lockfile).toBe('lock.json');
  });
});
