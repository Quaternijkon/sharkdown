import { describe, expect, it } from 'vitest';

import { segmentMarkdownForCards } from './segmentMarkdown';

describe('segmentMarkdownForCards', () => {
  it('splits by explicit slide separators first', () => {
    const result = segmentMarkdownForCards('# A\nText\n---\n# B\nMore', { maxChars: 120 });

    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].markdown).toContain('# A');
    expect(result.cards[1].markdown).toContain('# B');
  });

  it('splits long documents by second-level headings', () => {
    const result = segmentMarkdownForCards('# Title\n## One\nA\n## Two\nB', { maxChars: 80 });

    expect(result.cards.map((card) => card.title)).toEqual(['Title', 'One', 'Two']);
  });

  it('marks cards that still exceed the target length', () => {
    const longText = `# Long\n${'x'.repeat(180)}`;
    const result = segmentMarkdownForCards(longText, { maxChars: 60 });

    expect(result.cards.some((card) => card.warnings.includes('too-long'))).toBe(true);
  });
});
