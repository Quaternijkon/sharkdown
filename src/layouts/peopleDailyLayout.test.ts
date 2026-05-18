import { describe, expect, it } from 'vitest';

import { buildPeopleDailyDocument } from './peopleDailyLayout';

describe('buildPeopleDailyDocument', () => {
  it('selects long-article for one dominant long article', () => {
    const markdown = `# A Very Long Article Headline For Automatic Newspaper Typesetting Across Multiple Sharing Contexts

This is a long paragraph that represents one continuous article. It should not be forced into several unrelated newspaper story blocks.

This is a long paragraph that represents one continuous article. It should not be forced into several unrelated newspaper story blocks.

This is a long paragraph that represents one continuous article. It should not be forced into several unrelated newspaper story blocks.`;

    const doc = buildPeopleDailyDocument(markdown);

    expect(doc.variant).toBe('long-article');
    expect(doc.title).toContain('Automatic Newspaper');
    expect(doc.pages.length).toBeGreaterThanOrEqual(1);
  });

  it('selects front-page for multi-section source content', () => {
    const markdown = `# Daily Brief

## First Story
First story body.

## Second Story
Second story body.

## Third Story
Third story body.`;

    const doc = buildPeopleDailyDocument(markdown);

    expect(doc.variant).toBe('front-page');
    expect(doc.stories.map((story) => story.title)).toEqual(['First Story', 'Second Story', 'Third Story']);
  });

  it('creates continuation pages for long paragraph streams', () => {
    const paragraphs = Array.from(
      { length: 42 },
      (_, index) => `Paragraph ${index + 1} is used to verify that long content flows into another newspaper page.`,
    ).join('\n\n');

    const doc = buildPeopleDailyDocument(`# Long Article\n\n${paragraphs}`);

    expect(doc.pages.length).toBeGreaterThan(1);
    expect(doc.pages[1]?.pageNumber).toBe(2);
  });

  it('keeps image references as layout assets instead of Markdown text', () => {
    const doc = buildPeopleDailyDocument(`# Illustrated Report

![Meeting scene](local-image://asset-1/example.png)

Body paragraph.`);

    expect(doc.images).toEqual([{ alt: 'Meeting scene', src: 'local-image://asset-1/example.png' }]);
    expect(doc.paragraphs.join('\n')).not.toContain('local-image://asset-1');
  });

  it('keeps special Markdown blocks as newspaper text instead of dropping them', () => {
    const doc = buildPeopleDailyDocument(`# Technical Notes

## Data
- first item

| Column A | Column B |
|---|---|
| One | Two |

$$
E = mc^2
$$

\`\`\`ts
const value = 1;
\`\`\``);

    const text = doc.paragraphs.join('\n');

    expect(text).toContain('first item');
    expect(text).toContain('Column A');
    expect(text).toContain('E = mc^2');
    expect(text).toContain('const value = 1;');
  });
});
