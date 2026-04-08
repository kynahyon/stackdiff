import fs from 'fs';
import path from 'path';
import { parseLockfile, extractDependencies, PackageLock } from './lockfile';

const MOCK_LOCKFILE: PackageLock = {
  lockfileVersion: 3,
  packages: {
    '': { version: '1.0.0' },
    'node_modules/lodash': {
      version: '4.17.21',
      resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
      integrity: 'sha512-abc123',
    },
    'node_modules/typescript': {
      version: '5.3.3',
      dev: true,
    },
  },
};

const TMP_PATH = path.join(__dirname, '__tmp_lockfile.json');

beforeEach(() => {
  fs.writeFileSync(TMP_PATH, JSON.stringify(MOCK_LOCKFILE));
});

afterEach(() => {
  if (fs.existsSync(TMP_PATH)) fs.unlinkSync(TMP_PATH);
});

describe('parseLockfile', () => {
  it('parses a valid lockfile', () => {
    const result = parseLockfile(TMP_PATH);
    expect(result.lockfileVersion).toBe(3);
    expect(result.packages).toBeDefined();
  });

  it('throws if file does not exist', () => {
    expect(() => parseLockfile('/nonexistent/path.json')).toThrow('Lockfile not found');
  });

  it('throws on invalid JSON', () => {
    fs.writeFileSync(TMP_PATH, 'not json {{');
    expect(() => parseLockfile(TMP_PATH)).toThrow('Failed to parse lockfile JSON');
  });

  it('throws if packages field is missing', () => {
    fs.writeFileSync(TMP_PATH, JSON.stringify({ lockfileVersion: 3 }));
    expect(() => parseLockfile(TMP_PATH)).toThrow('missing "packages" field');
  });
});

describe('extractDependencies', () => {
  it('extracts all non-root packages', () => {
    const deps = extractDependencies(MOCK_LOCKFILE);
    expect(deps).toHaveLength(2);
  });

  it('strips node_modules/ prefix from names', () => {
    const deps = extractDependencies(MOCK_LOCKFILE);
    expect(deps.map(d => d.name)).toContain('lodash');
    expect(deps.map(d => d.name)).toContain('typescript');
  });

  it('correctly identifies dev dependencies', () => {
    const deps = extractDependencies(MOCK_LOCKFILE);
    const ts = deps.find(d => d.name === 'typescript');
    expect(ts?.dev).toBe(true);
    const lodash = deps.find(d => d.name === 'lodash');
    expect(lodash?.dev).toBe(false);
  });
});
