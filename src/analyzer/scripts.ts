import { DependencyMap } from '../parser/lockfile';

export type ScriptRisk = 'high' | 'medium' | 'low' | 'none';

export interface ScriptEntry {
  name: string;
  version: string;
  scripts: Record<string, string>;
  risk: ScriptRisk;
  flaggedScripts: string[];
}

export interface ScriptsAnalysis {
  entries: ScriptEntry[];
  totalWithScripts: number;
  highRisk: number;
  mediumRisk: number;
}

const HIGH_RISK_PATTERNS = [
  /curl\s+.*\|\s*(bash|sh)/i,
  /wget\s+.*\|\s*(bash|sh)/i,
  /eval\s*\(/i,
  /base64\s+--decode/i,
  /rm\s+-rf\s+\//i,
];

const MEDIUM_RISK_PATTERNS = [
  /node\s+-e/i,
  /exec\s*\(/i,
  /child_process/i,
  /\.\.\/\.\.\/\.\.\/\.\.\/\.\.//,
];

export function classifyScriptRisk(
  scripts: Record<string, string>
): { risk: ScriptRisk; flagged: string[] } {
  const flagged: string[] = [];

  for (const [key, value] of Object.entries(scripts)) {
    if (HIGH_RISK_PATTERNS.some((p) => p.test(value))) {
      flagged.push(`${key}: ${value}`);
    }
  }
  if (flagged.length > 0) return { risk: 'high', flagged };

  for (const [key, value] of Object.entries(scripts)) {
    if (MEDIUM_RISK_PATTERNS.some((p) => p.test(value))) {
      flagged.push(`${key}: ${value}`);
    }
  }
  if (flagged.length > 0) return { risk: 'medium', flagged };

  const lifecycleKeys = Object.keys(scripts).filter((k) =>
    ['preinstall', 'install', 'postinstall', 'prepare'].includes(k)
  );
  if (lifecycleKeys.length > 0) return { risk: 'low', flagged: lifecycleKeys };

  return { risk: 'none', flagged: [] };
}

export function analyzeScripts(deps: DependencyMap): ScriptsAnalysis {
  const entries: ScriptEntry[] = [];

  for (const [name, info] of Object.entries(deps)) {
    const scripts: Record<string, string> =
      (info as any).scripts ?? {};
    if (Object.keys(scripts).length === 0) continue;

    const { risk, flagged } = classifyScriptRisk(scripts);
    entries.push({
      name,
      version: info.version,
      scripts,
      risk,
      flaggedScripts: flagged,
    });
  }

  return {
    entries,
    totalWithScripts: entries.length,
    highRisk: entries.filter((e) => e.risk === 'high').length,
    mediumRisk: entries.filter((e) => e.risk === 'medium').length,
  };
}

export function formatScriptsReport(analysis: ScriptsAnalysis): string {
  if (analysis.entries.length === 0) {
    return 'No packages with lifecycle scripts found.\n';
  }

  const lines: string[] = [
    `Scripts Analysis — ${analysis.totalWithScripts} package(s) with lifecycle scripts`,
    `High risk: ${analysis.highRisk}  Medium risk: ${analysis.mediumRisk}`,
    '',
  ];

  const order: ScriptRisk[] = ['high', 'medium', 'low', 'none'];
  const sorted = [...analysis.entries].sort(
    (a, b) => order.indexOf(a.risk) - order.indexOf(b.risk)
  );

  for (const entry of sorted) {
    const badge =
      entry.risk === 'high'
        ? '[HIGH]'
        : entry.risk === 'medium'
        ? '[MED] '
        : '[LOW] ';
    lines.push(`${badge} ${entry.name}@${entry.version}`);
    for (const s of entry.flaggedScripts) {
      lines.push(`         ${s}`);
    }
  }

  return lines.join('\n') + '\n';
}
