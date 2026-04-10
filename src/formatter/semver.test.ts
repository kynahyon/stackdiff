import { formatSemverReport } from './semver';

const sampleVersions = [
  '1.0.0',
  '^2.3.4',
  '^1.0.0',
  '~3.1.0',
  '*',
  '>=1.0.0 <2.0.0',
  'latest',
];

describe('formatSemverReport', () => {
  describe('text format', () => {
    it('includes total package count', () => {
      const output = formatSemverReport(sampleVersions, 'text');
      expect(output).toContain('7 packages');
    });

    it('lists non-zero constraint types', () => {
      const output = formatSemverReport(sampleVersions, 'text');
      expect(output).toContain('Exact');
      expect(output).toContain('Minor');
      expect(output).toContain('Patch');
      expect(output).toContain('Major');
    });

    it('omits zero-count types', () => {
      const output = formatSemverReport(['1.0.0', '2.0.0'], 'text');
      expect(output).not.toContain('Minor');
    });
  });

  describe('json format', () => {
    it('returns valid JSON', () => {
      const output = formatSemverReport(sampleVersions, 'json');
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('includes total and summary', () => {
      const parsed = JSON.parse(formatSemverReport(sampleVersions, 'json'));
      expect(parsed.total).toBe(7);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.minor).toBe(2);
      expect(parsed.summary.exact).toBe(1);
    });

    it('includes parsed constraints array', () => {
      const parsed = JSON.parse(formatSemverReport(sampleVersions, 'json'));
      expect(Array.isArray(parsed.constraints)).toBe(true);
      expect(parsed.constraints.length).toBe(7);
    });
  });

  describe('markdown format', () => {
    it('contains markdown heading', () => {
      const output = formatSemverReport(sampleVersions, 'markdown');
      expect(output).toContain('## Semver Constraint Analysis');
    });

    it('contains table header', () => {
      const output = formatSemverReport(sampleVersions, 'markdown');
      expect(output).toContain('| Type | Count | Share |');
    });

    it('shows percentage values', () => {
      const output = formatSemverReport(sampleVersions, 'markdown');
      expect(output).toMatch(/\d+\.\d+%/);
    });
  });
});
