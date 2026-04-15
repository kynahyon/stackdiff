import {
  detectFundingType,
  extractFundingUrl,
  analyzeFunding,
  formatFundingReport,
} from './funding';

describe('detectFundingType', () => {
  it('returns none for null', () => {
    expect(detectFundingType(null)).toBe('none');
  });

  it('detects opencollective', () => {
    expect(detectFundingType('https://opencollective.com/webpack')).toBe('opencollective');
  });

  it('detects github sponsors', () => {
    expect(detectFundingType('https://github.com/sponsors/sindresorhus')).toBe('github');
  });

  it('detects patreon', () => {
    expect(detectFundingType('https://patreon.com/user')).toBe('patreon');
  });

  it('returns custom for unknown url', () => {
    expect(detectFundingType('https://example.com/donate')).toBe('custom');
  });
});

describe('extractFundingUrl', () => {
  it('returns null for falsy', () => {
    expect(extractFundingUrl(null)).toBeNull();
    expect(extractFundingUrl(undefined)).toBeNull();
  });

  it('returns string directly', () => {
    expect(extractFundingUrl('https://opencollective.com/foo')).toBe('https://opencollective.com/foo');
  });

  it('extracts url from object', () => {
    expect(extractFundingUrl({ type: 'opencollective', url: 'https://opencollective.com/foo' })).toBe(
      'https://opencollective.com/foo'
    );
  });

  it('extracts url from array', () => {
    expect(extractFundingUrl([{ url: 'https://github.com/sponsors/foo' }])).toBe(
      'https://github.com/sponsors/foo'
    );
  });
});

describe('analyzeFunding', () => {
  const packages = [
    { name: 'lodash', version: '4.17.21', funding: 'https://opencollective.com/lodash' },
    { name: 'chalk', version: '5.0.0' },
    { name: 'react', version: '18.0.0', funding: { url: 'https://github.com/sponsors/reactjs' } },
  ];

  it('counts funded and unfunded correctly', () => {
    const result = analyzeFunding(packages);
    expect(result.total).toBe(3);
    expect(result.funded).toBe(2);
    expect(result.unfunded).toBe(1);
  });

  it('assigns correct funding types', () => {
    const result = analyzeFunding(packages);
    expect(result.entries[0].fundingType).toBe('opencollective');
    expect(result.entries[1].fundingType).toBe('none');
    expect(result.entries[2].fundingType).toBe('github');
  });
});

describe('formatFundingReport', () => {
  it('includes summary line', () => {
    const analysis = analyzeFunding([
      { name: 'pkg-a', version: '1.0.0', funding: 'https://opencollective.com/pkg-a' },
      { name: 'pkg-b', version: '2.0.0' },
    ]);
    const report = formatFundingReport(analysis);
    expect(report).toContain('1/2 packages have funding');
    expect(report).toContain('pkg-a@1.0.0');
    expect(report).toContain('pkg-b@2.0.0');
  });
});
