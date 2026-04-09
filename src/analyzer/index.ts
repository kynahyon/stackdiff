export { analyzeSecurityRisks, getMajorVersion, isPreRelease } from './security';
export { analyzeImpact, summarizeImpact, determineSemverChange, parseVersion, mapSemverToImpact } from './impact';
export { buildTrendEntry, analyzeTrends, formatTrendReport } from './trends';
export type { TrendEntry, TrendSummary } from './trends';
