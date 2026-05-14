import { describe, expect, it } from 'vitest';

import { createStandaloneHtml } from './htmlExport';

describe('standalone HTML export', () => {
  it('creates a self-contained reading page without runtime scripts', () => {
    const html = createStandaloneHtml({
      title: 'Share Note',
      renderedHtml: '<h1>Share Note</h1><p>Readable <strong>Markdown</strong>.</p>',
      themeClassName: 'sharkdown-prose--claude',
      themeVars: {
        '--preview-bg': '#fffaf3',
        '--preview-text': '#23201b',
      },
      markdown: '# Share Note\n\nReadable **Markdown**.',
      includeSourceMarkdown: true,
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(html).toContain('<title>Share Note</title>');
    expect(html).toContain('<article class="sharkdown-document sharkdown-prose--claude"');
    expect(html).toContain('Readable <strong>Markdown</strong>.');
    expect(html).toContain('--preview-bg:#fffaf3');
    expect(html).toContain('data-sharkdown-source=');
    expect(html).toContain('此文件由 Sharkdown 离线生成');
    expect(html).not.toMatch(/<script[\s>]/i);
    expect(html).not.toContain('https://');
  });

  it('escapes metadata before writing it into the HTML shell', () => {
    const html = createStandaloneHtml({
      title: '<img src=x onerror=alert(1)>',
      renderedHtml: '<p>Body</p>',
      themeClassName: 'theme',
      themeVars: {},
      includeSourceMarkdown: false,
      generatedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<title><img');
  });
});
