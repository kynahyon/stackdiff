import { parsePatchArgs, runPatchCommand } from './patch-command';
import * as fs from 'fs';
import * as patch from '../analyzer/patch';

jest.mock('fs');
jest.mock('../parser/lockfile', () => ({
  parseLockfile: jest.fn(() => ({ lodash: '4.17.20' })),
}));
jest.mock('../diff/compare', () => ({
  compareDependencies: jest.fn(() => [
    { name: 'lodash', type: 'updated', from: '4.17.20', to: '4.17.21' },
  ]),
}));

const mockReadFileSync = fs.readFileSync as jest.Mock;

beforeEach(() => {
  mockReadFileSync.mockReturnValue('{}');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('parsePatchArgs', () => {
  it('parses positional file args', () => {
    const args = parsePatchArgs(['old.lock', 'new.lock']);
    expect(args.oldFile).toBe('old.lock');
    expect(args.newFile).toBe('new.lock');
  });

  it('parses --format flag', () => {
    const args = parsePatchArgs(['old.lock', 'new.lock', '--format', 'json']);
    expect(args.format).toBe('json');
  });

  it('parses --patch-only flag', () => {
    const args = parsePatchArgs(['old.lock', 'new.lock', '--patch-only']);
    expect(args.patchOnly).toBe(true);
  });

  it('defaults format to text', () => {
    const args = parsePatchArgs(['old.lock', 'new.lock']);
    expect(args.format).toBe('text');
  });

  it('defaults patchOnly to false', () => {
    const args = parsePatchArgs(['old.lock', 'new.lock']);
    expect(args.patchOnly).toBe(false);
  });
});

describe('runPatchCommand', () => {
  it('exits with error when files are missing', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runPatchCommand({ oldFile: '', newFile: '', format: 'text', patchOnly: false })).toThrow();
    mockExit.mockRestore();
  });

  it('exits with error when only oldFile is missing', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runPatchCommand({ oldFile: '', newFile: 'new.lock', format: 'text', patchOnly: false })).toThrow();
    mockExit.mockRestore();
  });

  it('exits with error when only newFile is missing', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runPatchCommand({ oldFile: 'old.lock', newFile: '', format: 'text', patchOnly: false })).toThrow();
    mockExit.mockRestore();
  });

  it('outputs text report by default', () => {
    runPatchCommand({ oldFile: 'old.lock', newFile: 'new.lock', format: 'text', patchOnly: false });
    expect(console.log).toHaveBeenCalled();
  });

  it('outputs JSON when format is json', () => {
    runPatchCommand({ oldFile: 'old.lock', newFile: 'new.lock', format: 'json', patchOnly: false });
    const output = (console.log as jest.Mock).mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
  });
});
