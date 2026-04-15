export type FundingType = 'opencollective' | 'github' | 'patreon' | 'custom' | 'none';

export interface FundingEntry {
  name: string;
  version: string;
  fundingType: FundingType;
  url: string | null;
  hasFunding: boolean;
}

export interface FundingAnalysis {
  entries: FundingEntry[];
  funded: number;
  unfunded: number;
  total: number;
}

export function detectFundingType(url: string | null): FundingType {
  if (!url) return 'none';
  if (url.includes('opencollective.com')) return 'opencollective';
  if (url.includes('github.com/sponsors') || url.includes('github.sponsors')) return 'github';
  if (url.includes('patreon.com')) return 'patreon';
  return 'custom';
}

export function extractFundingUrl(funding: unknown): string | null {
  if (!funding) return null;
  if (typeof funding === 'string') return funding;
  if (typeof funding === 'object' && funding !== null) {
    const f = funding as Record<string, unknown>;
    if (typeof f.url === 'string') return f.url;
  }
  if (Array.isArray(funding) && funding.length > 0) {
    return extractFundingUrl(funding[0]);
  }
  return null;
}

export function analyzeFunding(
  packages: Array<{ name: string; version: string; funding?: unknown }>
): FundingAnalysis {
  const entries: FundingEntry[] = packages.map(pkg => {
    const url = extractFundingUrl(pkg.funding ?? null);
    const fundingType = detectFundingType(url);
    return {
      name: pkg.name,
      version: pkg.version,
      fundingType,
      url,
      hasFunding: fundingType !== 'none',
    };
  });

  const funded = entries.filter(e => e.hasFunding).length;
  return { entries, funded, unfunded: entries.length - funded, total: entries.length };
}

export function formatFundingReport(analysis: FundingAnalysis): string {
  const lines: string[] = [];
  lines.push(`Funding Report (${analysis.funded}/${analysis.total} packages have funding)`);
  lines.push('');

  const funded = analysis.entries.filter(e => e.hasFunding);
  const unfunded = analysis.entries.filter(e => !e.hasFunding);

  if (funded.length > 0) {
    lines.push('Funded packages:');
    for (const e of funded) {
      lines.push(`  ${e.name}@${e.version} [${e.fundingType}] ${e.url ?? ''}`);
    }
    lines.push('');
  }

  if (unfunded.length > 0) {
    lines.push('Unfunded packages:');
    for (const e of unfunded) {
      lines.push(`  ${e.name}@${e.version}`);
    }
  }

  return lines.join('\n');
}
