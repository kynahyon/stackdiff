import { renderBadge, renderSummaryBlock } from './badge';
import { DiffSummary } from '../diff/compare';

const noChanges: DiffSummary = { added: 0, removed: 0, updated: 0, unchanged: 10 };
const withChanges: DiffSummary = { added: 3, removed: 1, updated: 2, unchanged: 5 };
const onlyAdded: DiffSummary = { added: 2, removed: 0, updated: 0, unchanged: 8 };

describe('renderBadge', () => {
  describe('text format (default)', () => {
    it('returns no-changes label when nothing changed', () => {
      expect(renderBadge(noChanges)).toBe('[deps: no changes]');
    });

    it('includes added/removed/updated counts', () => {
      const result = renderBadge(withChanges);
      expect(result).toContain('+3');
      expect(result).toContain('-1');
      expect(result).toContain('~2');
      expect(result).toContain('5 unchanged');
    });

    it('omits zero-count parts', () => {
      const result = renderBadge(onlyAdded);
      expect(result).toContain('+2');
      expect(result).not.toContain('-');
      expect(result).not.toContain('~');
    });
  });

  describe('markdown format', () => {
    it('returns bold markdown string', () => {
      const result = renderBadge(withChanges, { format: 'markdown' });
      expect(result).toMatch(/^\*\*Dependency changes:\*\*/);
      expect(result).toContain('+3');
    });

    it('returns no-changes badge when nothing changed', () => {
      const result = renderBadge(noChanges, { format: 'markdown' });
      expect(result).toContain('no%20changes');
    });
  });

  describe('shields format', () => {
    it('returns a shields.io URL', () => {
      const result = renderBadge(withChanges, { format: 'shields' });
      expect(result).toContain('img.shields.io/badge/deps-');
    });

    it('uses red color when packages are removed', () => {
      const result = renderBadge(withChanges, { format: 'shields' });
      expect(result).toContain('-red)');
    });

    it('uses blue color when only packages added', () => {
      const result = renderBadge(onlyAdded, { format: 'shields' });
      expect(result).toContain('-blue)');
    });
  });
});

describe('renderSummaryBlock', () => {
  it('includes all change type rows', () => {
    const result = renderSummaryBlock(withChanges);
    expect(result).toContain('Added');
    expect(result).toContain('Removed');
    expect(result).toContain('Updated');
    expect(result).toContain('Unchanged');
  });

  it('shows no changes message when diff is empty', () => {
    const result = renderSummaryBlock(noChanges);
    expect(result).toContain('No dependency changes detected');
  });

  it('shows changed count when there are changes', () => {
    const result = renderSummaryBlock(withChanges);
    expect(result).toContain('6 package(s) changed');
  });
});
