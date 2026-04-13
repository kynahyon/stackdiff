import { analyzeMaintainers, formatMaintainerReport } from '../analyzer/maintainer';

export interface MaintainerCommandArgs {
  lockfilePath: string;
  format: 'text' | 'json';
  abandonedDays: number;
}

export function parseMaintainerArgs(argv: string[]): MaintainerCommandArgs {
  const args: MaintainerCommandArgs = {
    lockfilePath: 'package-lock.json',
    format: 'text',
    abandonedDays: 730,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' || arg === '-f') {
      args.lockfilePath = argv[++i] ?? args.lockfilePath;
    } else if (arg === '--format') {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--abandoned-days') {
      const days = parseInt(argv[++i] ?? '', 10);
      if (!isNaN(days)) args.abandonedDays = days;
    }
  }

  return args;
}

export async function runMaintainerCommand(
  packages: Record<string, string>,
  metaMap: Record<string, { maintainerCount: number | null; lastPublished: string | null }>,
  args: MaintainerCommandArgs
): Promise<string> {
  const analysis = analyzeMaintainers(packages, metaMap, args.abandonedDays);

  if (args.format === 'json') {
    return JSON.stringify(analysis, null, 2);
  }

  return formatMaintainerReport(analysis);
}
