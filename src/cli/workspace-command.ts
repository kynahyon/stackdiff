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

export async function runWorkspaceCommand(argv: string[]): Promise<void> {
  const args = parseWorkspaceArgs(argv);
  const packages: WorkspacePackage[] = [];

  for (const dir of args.workspaceDirs) {
    const lockfilePath = path.join(dir, 'package-lock.json');
    const pkgJsonPath = path.join(dir, 'package.json');

    if (!fs.existsSync(lockfilePath)) {
      console.warn(`Warning: No package-lock.json found in ${dir}, skipping.`);
      continue;
    }

    const lockfileContent = fs.readFileSync(lockfilePath, 'utf-8');
    const pkgJsonContent = fs.existsSync(pkgJsonPath)
      ? JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
      : {};

    const lockfile = parseLockfile(lockfileContent);
    const dependencies = extractDependencies(lockfile);

    packages.push({
      name: pkgJsonContent.name || path.basename(dir),
      version: pkgJsonContent.version || '0.0.0',
      path: dir,
      dependencies,
    });
  }

  const analysis = analyzeWorkspace(packages);

  if (args.format === 'json') {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatWorkspaceReport(analysis));
  }
}
