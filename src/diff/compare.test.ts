import { compareDependencies, summarizeDiff, DiffResult } from './compare';
import { DependencyMap } from '../parser/lockfile';

const before: DependencyMap = {
  react: '17.0.2',
  lodash: '4.17.21',
  axios: '0.21.1',
  'old-pkg': '1.0.0',
};

const after: DependencyMap = {
  react: '18.2.0',
  lodash: '4.17.21',
  axios: '0.20.0',
  'new-pkg': '2.0.0',
};

describe('compareDependencies', () => {
  let result: DiffResult;

  beforeEach(() => {
    result = compareDependencies(before, after);
  });

  it('detects added packages', () => {
    expect(result.added).toHaveLength(1);
    expect(result.added[0]).toMatchObject({ name: 'new-pkg', type: 'added', to: '2.0.0' });
  });

  it('detects removed packages', () => {
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]).toMatchObject({ name: 'old-pkg', type: 'removed', from: '1.0.0' });
  });

  it('detects upgraded packages', () => {
    expect(result.upgraded).toHaveLength(1);
    expect(result.upgraded[0]).toMatchObject({ name: 'react', type: 'upgraded', from: '17.0.2', to: '18.2.0' });
  });

  it('detects downgraded packages', () => {
    expect(result.downgraded).toHaveLength(1);
    expect(result.downgraded[0]).toMatchObject({ name: 'axios', type: 'downgraded', from: '0.21.1', to: '0.20.0' });
  });

  it('detects unchanged packages', () => {
    expect(result.unchanged).toHaveLength(1);
    expect(result.unchanged[0]).toMatchObject({ name: 'lodash', type: 'unchanged' });
  });

  it('returns empty diff for identical maps', () => {
    const same = compareDependencies(before, before);
    expect(same.added).toHaveLength(0);
    expect(same.removed).toHaveLength(0);
    expect(same.upgraded).toHaveLength(0);
    expect(same.downgraded).toHaveLength(0);
    expect(same.unchanged).toHaveLength(4);
  });
});

describe('summarizeDiff', () => {
  it('returns a human-readable summary', () => {
    const result = compareDependencies(before, after);
    const summary = summarizeDiff(result);
    expect(summary).toContain('added');
    expect(summary).toContain('removed');
    expect(summary).toContain('upgraded');
    expect(summary).toContain('downgraded');
  });

  it('returns no-changes message for empty diff', () => {
    const empty: DiffResult = { added: [], removed: [], upgraded: [], downgraded: [], unchanged: [] };
    expect(summarizeDiff(empty)).toBe('No changes detected.');
  });
});
