import { DependencyMap } from '../parser/lockfile';
import { DiffResult } from '../diff/compare';

export interface PatchEntry {
  name: string;
  from: string;
  to: string;
  isPatch: boolean;
  isMinor: boolean;
  isMajor: boolean;
  patchCount: number;
}

export interface PatchSummary {
  patches: PatchEntry[];
  totalPatches: number;
  totalMinor: number;
  totalMajor: number;
  safeToAutoUpdate: string[];
}

export function classifyPatchChange(
  from: string,
  to: string
): Pick<PatchEntry, 'isPatch' | 'isMinor' | 'isMajor'> {
  const clean = (v: string) => v.replace(/^[^\d]*/, '');
  const [fMaj, fMin, fPat] = clean(from).split('.').map(Number);
  const [tMaj, tMin, tPat] = clean(to).split('.').map(Number);

  if (isNaN(fMaj) || isNaN(tMaj)) {
    return { isPatch: false, isMinor: false, isMajor: false };
  }

  const isMajor = tMaj > fMaj;
  const isMinor = !isMajor && tMin > fMin;
  const isPatch = !isMajor && !isMinor && tPat > fPat;

  return { isPatch, isMinor, isMajor };
}

export function countPatchDistance(from: string, to: string): number {
  const clean = (v: string) => v.replace(/^[^\d]*/, '');
  const [, , fPat] = clean(from).split('.').map(Number);
  const [, , tPat] = clean(to).split('.').map(Number);
  if (isNaN(fPat) || isNaN(tPat)) return 0;
  return Math.max(0, tPat - fPat);
}

export function analyzePatchChanges(
  diff: DiffResult[]
): PatchSummary {
  const patches: PatchEntry[] = diff
    .filter((d) => d.type === 'updated' && d.from && d.to)
    .map((d) => {
      const classification = classifyPatchChange(d.from!, d.to!);
      return {
        name: d.name,
        from: d.from!,
        to: d.to!,
        patchCount: countPatchDistance(d.from!, d.to!),
        ...classification,
      };
    });

  const safeToAutoUpdate = patches
    .filter((p) => p.isPatch)
    .map((p) => p.name);

  return {
    patches,
    totalPatches: patches.filter((p) => p.isPatch).length,
    totalMinor: patches.filter((p) => p.isMinor).length,
    totalMajor: patches.filter((p) => p.isMajor).length,
    safeToAutoUpdate,
  };
}

export function formatPatchReport(summary: PatchSummary): string {
  const lines: string[] = ['## Patch Analysis\n'];
  lines.push(`- Patch updates: ${summary.totalPatches}`);
  lines.push(`- Minor updates: ${summary.totalMinor}`);
  lines.push(`- Major updates: ${summary.totalMajor}`);

  if (summary.safeToAutoUpdate.length > 0) {
    lines.push(`\n### Safe to auto-update (patch only):`);
    summary.safeToAutoUpdate.forEach((name) => lines.push(`  - ${name}`));
  }

  if (summary.patches.length > 0) {
    lines.push('\n### All version changes:');
    summary.patches.forEach((p) => {
      const tag = p.isMajor ? '[MAJOR]' : p.isMinor ? '[MINOR]' : '[PATCH]';
      lines.push(`  ${tag} ${p.name}: ${p.from} → ${p.to}`);
    });
  }

  return lines.join('\n');
}
