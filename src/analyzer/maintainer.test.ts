import {
  isAbandoned,
  classifyMaintainerRisk,
  analyzeMaintainers,
  formatMaintainerReport,
  MaintainerInfo,
} from './maintainer';

const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const oldDate = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000).toISOString();

describe('isAbandoned', () => {
  it('returns false for recently published package', () => {
    expect(isAbandoned(recentDate)).toBe(false);
  });

  it('returns true for package not published in over 2 years', () => {
    expect(isAbandoned(oldDate)).toBe(true);
  });

  it('returns false for null lastPublished', () => {
    expect(isAbandoned(null)).toBe(false);
  });

  it('respects custom threshold', () => {
    expect(isAbandoned(oldDate, 1000)).toBe(false);
    expect(isAbandoned(oldDate, 100)).toBe(true);
  });
});

describe('classifyMaintainerRisk', () => {
  const base: MaintainerInfo = {
    name: 'pkg',
    version: '1.0.0',
    maintainerCount: 3,
    lastPublished: recentDate,
    isAbandoned: false,
  };

  it('returns low for multi-maintainer active package', () => {
    expect(classifyMaintainerRisk(base)).toBe('low');
  });

  it('returns medium for single maintainer', () => {
    expect(classifyMaintainerRisk({ ...base, maintainerCount: 1 })).toBe('medium');
  });

  it('returns high for abandoned package', () => {
    expect(classifyMaintainerRisk({ ...base, isAbandoned: true })).toBe('high');
  });

  it('returns unknown when maintainerCount is null', () => {
    expect(classifyMaintainerRisk({ ...base, maintainerCount: null })).toBe('unknown');
  });
});

describe('analyzeMaintainers', () => {
  const packages = { react: '18.0.0', 'old-lib': '1.0.0', 'solo-pkg': '2.0.0' };
  const metaMap = {
    react: { maintainerCount: 5, lastPublished: recentDate },
    'old-lib': { maintainerCount: 2, lastPublished: oldDate },
    'solo-pkg': { maintainerCount: 1, lastPublished: recentDate },
  };

  it('counts abandoned packages correctly', () => {
    const result = analyzeMaintainers(packages, metaMap);
    expect(result.abandonedCount).toBe(1);
  });

  it('counts single maintainer packages', () => {
    const result = analyzeMaintainers(packages, metaMap);
    expect(result.singleMaintainerCount).toBe(1);
  });

  it('counts unknown packages', () => {
    const result = analyzeMaintainers(packages, { react: { maintainerCount: null, lastPublished: null } });
    expect(result.unknownCount).toBe(1);
  });
});

describe('formatMaintainerReport', () => {
  it('includes header and summary', () => {
    const analysis = analyzeMaintainers(
      { react: '18.0.0' },
      { react: { maintainerCount: 5, lastPublished: recentDate } }
    );
    const report = formatMaintainerReport(analysis);
    expect(report).toContain('## Maintainer Analysis');
    expect(report).toContain('react@18.0.0');
  });
});
