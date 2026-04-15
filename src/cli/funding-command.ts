import { analyzeFunding, formatFundingReport } from '../analyzer/funding';

export interface FundingArgs {
  file: string;
  format: 'text' | 'json';
  onlyUnfunded: boolean;
}

export function parseFundingArgs(argv: string[]): FundingArgs {
  const args: FundingArgs = { file: 'package-lock.json', format: 'text', onlyUnfunded: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--file' || arg === '-f') && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--only-unfunded') {
      args.onlyUnfunded = true;
    }
  }
  return args;
}

export async function runFundingCommand(
  packages: Array<{ name: string; version: string; funding?: unknown }>,
  args: FundingArgs
): Promise<string> {
  let analysis = analyzeFunding(packages);

  if (args.onlyUnfunded) {
    analysis = {
      ...analysis,
      entries: analysis.entries.filter(e => !e.hasFunding),
    };
  }

  if (args.format === 'json') {
    return JSON.stringify(analysis, null, 2);
  }

  return formatFundingReport(analysis);
}
