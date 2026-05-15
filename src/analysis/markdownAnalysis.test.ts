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
});
