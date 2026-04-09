import { parseArgs, CliArgs } from './args';

describe('parseArgs', () => {
  const baseArgv = ['node', 'stackdiff'];

  it('parses required lockfile arguments', () => {
    const result = parseArgs([...baseArgv, 'old.lock', 'new.lock']);
    expect(result.lockfileA).toBe('old.lock');
    expect(result.lockfileB).toBe('new.lock');
  });

  it('defaults format to text', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock']);
    expect(result.options.format).toBe('text');
  });

  it('parses --format json', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--format', 'json']);
    expect(result.options.format).toBe('json');
  });

  it('parses --format markdown', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--format', 'markdown']);
    expect(result.options.format).toBe('markdown');
  });

  it('parses --filter added', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--filter', 'added']);
    expect(result.options.filter).toBe('added');
  });

  it('parses --filter removed', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--filter', 'removed']);
    expect(result.options.filter).toBe('removed');
  });

  it('defaults verbose to false', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock']);
    expect(result.options.verbose).toBe(false);
  });

  it('parses --verbose flag', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--verbose']);
    expect(result.options.verbose).toBe(true);
  });

  it('defaults noColor to false', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock']);
    expect(result.options.noColor).toBe(false);
  });

  it('parses --no-color flag', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock', '--no-color']);
    expect(result.options.noColor).toBe(true);
  });

  it('returns undefined filter when not specified', () => {
    const result = parseArgs([...baseArgv, 'a.lock', 'b.lock']);
    expect(result.options.filter).toBeUndefined();
  });
});
