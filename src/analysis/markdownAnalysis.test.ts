import { describe, expect, it } from 'vitest';

import { analyzeMarkdown } from './markdownAnalysis';

describe('analyzeMarkdown', () => {
  it('detects markdown features, code languages, sections, and task progress', () => {
    const report = analyzeMarkdown(`# Project Plan

Intro paragraph.

## Tasks

- [x] Draft
- [ ] Review

## Code

\`\`\`ts
const ok = true;
\`\`\`

> Important note.

| Module | Status |
|---|---|
| Export | Ready |
`);

    expect(report.insights.markdownFeatures.filter((feature) => feature.present).map((feature) => feature.id)).toEqual(
      expect.arrayContaining(['heading', 'taskList', 'codeBlock', 'blockquote', 'table']),
    );
    expect(report.insights.programmingLanguages).toEqual([{ language: 'ts', count: 1 }]);
    expect(report.statistics.taskProgress).toMatchObject({ total: 2, completed: 1, completionRate: 0.5 });
    expect(report.statistics.sectionDistribution.map((section) => section.title)).toEqual(['Project Plan', 'Tasks', 'Code']);
    expect(report.evaluation.scores.structureClarity).toBeGreaterThan(60);
  });

  it('reports richer offline statistics for share-focused analysis', () => {
    const report = analyzeMarkdown(`# Share Note

这是一段用于社交媒体分享的中文内容，包含关键观点和说明。

## Assets

![Cover](local-image://cover)

| Item | Value |
|---|---|
| A | 1 |

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`);

    expect(report.statistics.basic).toMatchObject({
      lineCount: expect.any(Number),
      characterCount: expect.any(Number),
      headingCount: 2,
      imageCount: 1,
      tableCount: 1,
      codeBlockCount: 1,
    });
    expect(report.statistics.syntaxCoverage).toMatchObject({
      present: expect.any(Number),
      total: expect.any(Number),
      rate: expect.any(Number),
    });
    expect(report.statistics.headingDepth).toMatchObject({ h1: 1, h2: 1 });
    expect(report.evaluation.scores.shareReadiness).toBeGreaterThan(50);
    expect(report.insights.recommendations.length).toBeGreaterThan(0);
  });

  it('normalizes content type distribution for stacked charts', () => {
    const report = analyzeMarkdown(`# Mixed

Paragraph text.

- item
- [x] task

\`\`\`ts
const ok = true;
\`\`\`

![Cover](local-image://cover)
`);

    const total = Object.values(report.statistics.contentTypeDistribution).reduce((sum, value) => sum + value, 0);

    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
  });
});
