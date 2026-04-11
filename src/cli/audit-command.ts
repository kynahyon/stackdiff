import * as fs from 'fs';
import * as path from 'path';
import { parseLockfile, extractDependencies } from '../parser/lockfile';
import { compareDependencies } from '../diff/compare';
import { auditChanges, formatAuditReport, AuditVulnerability } from '../analyzer/audit';

export interface AuditArgs {
  oldLockfile: string;
  newLockfile: string;
  advisoryFile?: string;
  format: 'text' | 'json';
  failOnSeverity?: string;
}

export function parseAuditArgs(argv: string[]): AuditArgs {
  const args: AuditArgs = {
    oldLockfile: '',
    newLockfile: '',
    format: 'text',
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--old':
        args.oldLockfile = argv[++i];
        break;
      case '--new':
        args.newLockfile = argv[++i];
        break;
      case '--advisory':
        args.advisoryFile = argv[++i];
        break;
      case '--format':
        args.format = argv[++i] as 'text' | 'json';
        break;
      case '--fail-on':
        args.failOnSeverity = argv[++i];
        break;
    }
  }

  return args;
}

export function runAuditCommand(args: AuditArgs): void {
  if (!args.oldLockfile || !args.newLockfile) {
    console.error('Error: --old and --new lockfile paths are required.');
    process.exit(1);
  }

  const oldContent = fs.readFileSync(path.resolve(args.oldLockfile), 'utf-8');
  const newContent = fs.readFileSync(path.resolve(args.newLockfile), 'utf-8');

  const oldDeps = extractDependencies(parseLockfile(oldContent));
  const newDeps = extractDependencies(parseLockfile(newContent));
  const changes = compareDependencies(oldDeps, newDeps);

  let advisories: AuditVulnerability[] = [];
  if (args.advisoryFile) {
    const raw = fs.readFileSync(path.resolve(args.advisoryFile), 'utf-8');
    advisories = JSON.parse(raw) as AuditVulnerability[];
  }

  const summary = auditChanges(changes, advisories);

  if (args.format === 'json') {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(formatAuditReport(summary));
  }

  if (args.failOnSeverity && summary.results.length > 0) {
    const severities = ['critical', 'high', 'moderate', 'low', 'info'];
    const threshold = severities.indexOf(args.failOnSeverity);
    const hasViolation = summary.results.some((r) =>
      r.vulnerabilities.some((v) => severities.indexOf(v.severity) <= threshold)
    );
    if (hasViolation) {
      process.exit(1);
    }
  }
}
