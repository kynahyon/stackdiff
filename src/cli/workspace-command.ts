import * as path from 'path';
import * as fs from 'fs';
import { analyzeWorkspace, formatWorkspaceReport, WorkspacePackage } from '../analyzer/workspace';
import { parseLockfile, extractDependencies } from '../parser/lockfile';

export interface WorkspaceArgs {
  workspaceDirs: string[];
  format: 'text' | 'json';
}

export function parseWorkspaceArgs(argv: string[]): WorkspaceArgs {
  const args = argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'text';
  const workspaceDirs = args.filter((a) => !a.startsWith('--'));

  if (workspaceDirs.length === 0) {
    throw new Error('At least one workspace directory must be provided.');
  }

  return { workspaceDirs, format };
}

function loadPackage(dir: string): WorkspacePackage | null {
  const lockfilePath = path.join(dir, 'package-lock.json');
  const pkgJsonPath = path.join(dir, 'package.json');

  if (!fs.existsSync(lockfilePath)) {
    console.warn(`Warning: No package-lock.json found in ${dir}, skipping.`);
    return null;
  }

  let lockfileContent: string;
  try {
    lockfileContent = fs.readFileSync(lockfilePath, 'utf-8');
  } catch (err) {
    console.warn(`Warning: Could not read package-lock.json in ${dir}: ${(err as Error).message}`);
    return null;
  }

  const pkgJsonContent = fs.existsSync(pkgJsonPath)
    ? JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    : {};

  const lockfile = parseLockfile(lockfileContent);
  const dependencies = extractDependencies(lockfile);

  return {
    name: pkgJsonContent.name || path.basename(dir),
    version: pkgJsonContent.version || '0.0.0',
    path: dir,
    dependencies,
  };
}

export async function runWorkspaceCommand(argv: string[]): Promise<void> {
  const args = parseWorkspaceArgs(argv);
  const packages: WorkspacePackage[] = [];

  for (const dir of args.workspaceDirs) {
    const pkg = loadPackage(dir);
    if (pkg) {
      packages.push(pkg);
    }
  }

  const analysis = analyzeWorkspace(packages);

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatWorkspaceReport(analysis));
  }
}
