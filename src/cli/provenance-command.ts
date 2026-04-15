import { analyzeProvenance, formatProvenanceReport, ProvenanceReport } from '../analyzer/provenance';

export interface ProvenanceArgs {
  dependencies: Record<string, string>;
  format: 'text' | 'json';
  onlyFailed: boolean;
}

export function parseProvenanceArgs(argv: string[]): ProvenanceArgs {
  const format = argv.includes('--json') ? 'json' : 'text';
  const onlyFailed = argv.includes('--only-failed');
  return { dependencies: {}, format, onlyFailed };
}

export function runProvenanceCommand(
  dependencies: Record<string, string>,
  args: Omit<ProvenanceArgs, 'dependencies'>
): string {
  const report: ProvenanceReport = analyzeProvenance(dependencies);

  if (args.onlyFailed) {
    report.entries = report.entries.filter((e) => e.status !== 'verified');
  }

  if (args.format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  return formatProvenanceReport(report);
}
