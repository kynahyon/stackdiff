import { run } from './runner';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const sampleLockfileA = JSON.stringify({
  dependencies: {
    lodash: { version: '4.17.20' },
    react: { version: '17.0.1' },
  },
});

const sampleLockfileB = JSON.stringify({
  dependencies: {
    lodash: { version: '4.17.21' },
    react: { version: '18.0.0' },
    axios: { version: '1.0.0' },
  },
});

describe('run', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation((filePath: any) => {
      if (String(filePath).includes('old')) return sampleLockfileA;
      return sampleLockfileB;
    });
  });

  it('returns success with output for valid args', async () => {
    const result = await run(['old.lock', 'new.lock']);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it('returns error when from file does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(false);
    const result = await run(['missing.lock', 'new.lock']);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File not found/);
  });

  it('returns error when to file does not exist', async () => {
    mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const result = await run(['old.lock', 'missing.lock']);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File not found/);
  });

  it('returns error for invalid args', async () => {
    const result = await run([]);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Argument error/);
  });

  it('supports --format json flag', async () => {
    const result = await run(['old.lock', 'new.lock', '--format', 'json']);
    expect(result.success).toBe(true);
    expect(() => JSON.parse(result.output!)).not.toThrow();
  });
});
