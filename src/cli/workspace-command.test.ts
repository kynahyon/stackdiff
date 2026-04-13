import { parseWorkspaceArgs } from './workspace-command';

describe('parseWorkspaceArgs', () => {
  it('parses single workspace directory', () => {
    const args = parseWorkspaceArgs(['node', 'stackdiff', 'packages/app']);
    expect(args.workspaceDirs).toEqual(['packages/app']);
    expect(args.format).toBe('text');
  });

  it('parses multiple workspace directories', () => {
    const args = parseWorkspaceArgs(['node', 'stackdiff', 'packages/app', 'packages/lib']);
    expect(args.workspaceDirs).toEqual(['packages/app', 'packages/lib']);
  });

  it('parses --json format flag', () => {
    const args = parseWorkspaceArgs(['node', 'stackdiff', 'packages/app', '--json']);
    expect(args.format).toBe('json');
    expect(args.workspaceDirs).toEqual(['packages/app']);
  });

  it('excludes flags from workspaceDirs', () => {
    const args = parseWorkspaceArgs(['node', 'stackdiff', '--json', 'packages/app', 'packages/lib']);
    expect(args.workspaceDirs).toEqual(['packages/app', 'packages/lib']);
  });

  it('throws when no directories provided', () => {
    expect(() => parseWorkspaceArgs(['node', 'stackdiff'])).toThrow(
      'At least one workspace directory must be provided.'
    );
  });

  it('throws when only flags provided', () => {
    expect(() => parseWorkspaceArgs(['node', 'stackdiff', '--json'])).toThrow(
      'At least one workspace directory must be provided.'
    );
  });
});
