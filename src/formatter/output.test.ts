import { formatOutput } from './output';
import { DiffSummary } from '../diff/compare';

const mockSummary: DiffSummary = {
  added: [{ name: 'lodash', oldVersion: null, newVersion: '4.17.21', changeType: 'added' }],
  removed: [{ name: 'moment', oldVersion: '2.29.1', newVersion: null, changeType: 'removed' }],
  updated: [
    { name: 'react', oldVersion: '17.0.2', newVersion: '18.2.0', changeType: 'updated' }
  ],
  unchanged: [{ name: 'typescript', oldVersion: '5.0.0', newVersion: '5.0.0', changeType: 'unchanged' }],
  totalChanges: 3,
};

describe('formatOutput', () => {
  describe('json format', () => {
    it('returns valid JSON string', () => {
      const result = formatOutput(mockSummary, 'json');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('includes all change categories', () => {
      const result = JSON.parse(formatOutput(mockSummary, 'json'));
      expect(result).toHaveProperty('added');
      expect(result).toHaveProperty('removed');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('unchanged');
    });
  });

  describe('markdown format', () => {
    it('includes markdown headers', () => {
      const result = formatOutput(mockSummary, 'markdown');
      expect(result).toContain('## Dependency Changes');
    });

    it('lists added packages', () => {
      const result = formatOutput(mockSummary, 'markdown');
      expect(result).toContain('lodash@4.17.21');
    });

    it('lists removed packages', () => {
      const result = formatOutput(mockSummary, 'markdown');
      expect(result).toContain('moment@2.29.1');
    });

    it('shows version transition for updated packages', () => {
      const result = formatOutput(mockSummary, 'markdown');
      expect(result).toContain('17.0.2');
      expect(result).toContain('18.2.0');
    });
  });

  describe('text format', () => {
    it('defaults to text format', () => {
      const result = formatOutput(mockSummary);
      expect(result).toContain('Dependency Changes Summary');
    });

    it('includes counts for each category', () => {
      const result = formatOutput(mockSummary, 'text');
      expect(result).toContain('Added');
      expect(result).toContain('Removed');
      expect(result).toContain('Updated');
    });
  });
});
