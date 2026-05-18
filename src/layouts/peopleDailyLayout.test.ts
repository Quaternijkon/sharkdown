import { describe, expect, it } from 'vitest';

import { buildPeopleDailyDocument } from './peopleDailyLayout';

describe('buildPeopleDailyDocument', () => {
  it('selects long-article for one dominant long article', () => {
    const markdown = `# 以更完善的制度体系推动内容自动排版在不同媒介场景中稳定生成高质量分享版面

这是一段很长的正文，用来模拟单篇文章。它包含较长的句子和连续论述，不应该被强行拆成多个新闻块。

这是一段很长的正文，用来模拟单篇文章。它包含较长的句子和连续论述，不应该被强行拆成多个新闻块。

这是一段很长的正文，用来模拟单篇文章。它包含较长的句子和连续论述，不应该被强行拆成多个新闻块。`;

    const doc = buildPeopleDailyDocument(markdown);

    expect(doc.variant).toBe('long-article');
    expect(doc.title).toContain('制度体系');
    expect(doc.pages.length).toBeGreaterThanOrEqual(1);
  });

  it('selects front-page for multi-section source content', () => {
    const markdown = `# 今日要闻

## 第一条新闻
第一条新闻正文。

## 第二条新闻
第二条新闻正文。

## 第三条新闻
第三条新闻正文。`;

    const doc = buildPeopleDailyDocument(markdown);

    expect(doc.variant).toBe('front-page');
    expect(doc.stories.map((story) => story.title)).toEqual(['第一条新闻', '第二条新闻', '第三条新闻']);
  });

  it('creates continuation pages for long paragraph streams', () => {
    const paragraphs = Array.from(
      { length: 42 },
      (_, index) => `第${index + 1}段内容用于测试分页，确保超长内容会进入下一张报纸页面。`,
    ).join('\n\n');

    const doc = buildPeopleDailyDocument(`# 长文章\n\n${paragraphs}`);

    expect(doc.pages.length).toBeGreaterThan(1);
    expect(doc.pages[1]?.pageNumber).toBe(2);
  });

  it('keeps image references as layout assets instead of Markdown text', () => {
    const doc = buildPeopleDailyDocument(`# 图文报道

![会见现场](local-image://asset-1/example.png)

正文段落。`);

    expect(doc.images).toEqual([{ alt: '会见现场', src: 'local-image://asset-1/example.png' }]);
    expect(doc.paragraphs.join('\n')).not.toContain('local-image://asset-1');
  });
});
