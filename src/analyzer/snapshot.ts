import * as fs from 'fs';
import * as path from 'path';
import { DependencyMap } from '../parser';

export interface Snapshot {
  timestamp: string;
  label: string;
  dependencies: DependencyMap;
}

export interface SnapshotStore {
  snapshots: Snapshot[];
}

export function createSnapshot(label: string, dependencies: DependencyMap): Snapshot {
  return {
    timestamp: new Date().toISOString(),
    label,
    dependencies,
  };
}

export function saveSnapshot(snapshot: Snapshot, storePath: string): void {
  let store: SnapshotStore = { snapshots: [] };
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf-8');
    store = JSON.parse(raw) as SnapshotStore;
  }
  const existing = store.snapshots.findIndex((s) => s.label === snapshot.label);
  if (existing >= 0) {
    store.snapshots[existing] = snapshot;
  } else {
    store.snapshots.push(snapshot);
  }
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function loadSnapshot(label: string, storePath: string): Snapshot | null {
  if (!fs.existsSync(storePath)) return null;
  const raw = fs.readFileSync(storePath, 'utf-8');
  const store = JSON.parse(raw) as SnapshotStore;
  return store.snapshots.find((s) => s.label === label) ?? null;
}

export function listSnapshots(storePath: string): Snapshot[] {
  if (!fs.existsSync(storePath)) return [];
  const raw = fs.readFileSync(storePath, 'utf-8');
  const store = JSON.parse(raw) as SnapshotStore;
  return store.snapshots.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function formatSnapshotList(snapshots: Snapshot[]): string {
  if (snapshots.length === 0) return 'No snapshots found.';
  const lines = snapshots.map((s) => {
    const count = Object.keys(s.dependencies).length;
    return `  [${s.timestamp}] ${s.label} — ${count} dependencies`;
  });
  return `Snapshots:\n${lines.join('\n')}`;
}
