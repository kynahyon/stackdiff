import { Dependency } from '../parser';

const COMMON_TYPOS: Record<string, string[]> = {
  'lodash': ['1odash', 'lodahs', 'lodsh', 'lodaash'],
  'express': ['expres', 'expresss', 'exprss'],
  'react': ['recat', 'raect', 'reaact'],
  'axios': ['axois', 'axio', 'axioss'],
  'webpack': ['webpak', 'webpackk', 'webpakc'],
  'typescript': ['typescrip', 'typscript', 'tyepscript'],
  'eslint': ['eslin', 'eslnit', 'eslints'],
  'prettier': ['prettir', 'pretter', 'pretteir'],
  'babel': ['babal', 'bable', 'babels'],
  'jest': ['jset', 'jests', 'jsest'],
};

export interface TyposquatResult {
  name: string;
  suspectedTarget: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface TyposquatReport {
  suspicious: TyposquatResult[];
  total: number;
  checked: number;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function checkTyposquat(name: string): TyposquatResult | null {
  const bare = name.replace(/^@[^/]+\//, '');
  for (const [popular, typos] of Object.entries(COMMON_TYPOS)) {
    if (typos.includes(bare)) {
      return { name, suspectedTarget: popular, confidence: 'high', reason: 'Known typosquat pattern' };
    }
    const dist = levenshtein(bare, popular);
    if (dist === 1 && bare !== popular) {
      return { name, suspectedTarget: popular, confidence: 'medium', reason: `Edit distance 1 from "${popular}"` };
    }
    if (dist === 2 && bare.length >= 5) {
      return { name, suspectedTarget: popular, confidence: 'low', reason: `Edit distance 2 from "${popular}"` };
    }
  }
  return null;
}

export function analyzeTyposquat(deps: Dependency[]): TyposquatReport {
  const suspicious: TyposquatResult[] = [];
  for (const dep of deps) {
    const result = checkTyposquat(dep.name);
    if (result) suspicious.push(result);
  }
  return { suspicious, total: suspicious.length, checked: deps.length };
}

export function formatTyposquatReport(report: TyposquatReport): string {
  if (report.total === 0) {
    return `✅ No typosquat suspects found (checked ${report.checked} packages).\n`;
  }
  const lines: string[] = [
    `⚠️  ${report.total} suspicious package(s) found (checked ${report.checked}):`,
    '',
  ];
  for (const r of report.suspicious) {
    lines.push(`  ${r.confidence.toUpperCase().padEnd(6)} ${r.name} → suspected "${r.suspectedTarget}" (${r.reason})`);
  }
  return lines.join('\n') + '\n';
}
