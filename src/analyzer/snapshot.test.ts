import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  formatSnapshotList,
} from './snapshot';

const deps = { react: '18.0.0', lodash: '4.17.21' };

let tmpDir: string;
let storePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-'));
  storePath = path.join(tmpDir, 'snapshots.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createSnapshot returns snapshot with timestamp and label', () => {
  const snap = createSnapshot('v1.0', deps);
  expect(snap.label).toBe('v1.0');
  expect(snap.dependencies).toEqual(deps);
  expect(snap.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
});

test('saveSnapshot writes to file and loadSnapshot retrieves it', () => {
  const snap = createSnapshot('release-1', deps);
  saveSnapshot(snap, storePath);
  const loaded = loadSnapshot('release-1', storePath);
  expect(loaded).not.toBeNull();
  expect(loaded?.label).toBe('release-1');
  expect(loaded?.dependencies).toEqual(deps);
});

test('saveSnapshot overwrites existing label', () => {
  const snap1 = createSnapshot('main', deps);
  saveSnapshot(snap1, storePath);
  const snap2 = createSnapshot('main', { react: '19.0.0' });
  saveSnapshot(snap2, storePath);
  const loaded = loadSnapshot('main', storePath);
  expect(loaded?.dependencies.react).toBe('19.0.0');
});

test('loadSnapshot returns null when store does not exist', () => {
  const result = loadSnapshot('missing', storePath);
  expect(result).toBeNull();
});

test('listSnapshots returns all snapshots sorted by timestamp', () => {
  saveSnapshot(createSnapshot('b', deps), storePath);
  saveSnapshot(createSnapshot('a', deps), storePath);
  const list = listSnapshots(storePath);
  expect(list).toHaveLength(2);
});

test('formatSnapshotList returns message for empty list', () => {
  expect(formatSnapshotList([])).toBe('No snapshots found.');
});

test('formatSnapshotList includes label and dep count', () => {
  const snap = createSnapshot('v2.0', deps);
  const output = formatSnapshotList([snap]);
  expect(output).toContain('v2.0');
  expect(output).toContain('2 dependencies');
});
