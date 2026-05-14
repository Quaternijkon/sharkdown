import { describe, expect, it } from 'vitest';

import { runConvertPreflight } from './convertPreflight';

describe('runConvertPreflight', () => {
  it('warns when a card target receives too much text', () => {
    const result = runConvertPreflight({
      markdown: '# Long\n' + 'x'.repeat(900),
      renderedHtml: '<h1>Long</h1><p>x</p>',
      targetId: 'xiaohongshu',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.items.some((item) => item.code === 'card-text-too-long')).toBe(true);
  });

  it('warns about remote images for offline conversion', () => {
    const result = runConvertPreflight({
      markdown: '![x](https://example.com/a.png)',
      renderedHtml: '<img src="https://example.com/a.png">',
      targetId: 'print',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.items.some((item) => item.code === 'remote-image')).toBe(true);
  });

  it('allows simple markdown for github export', () => {
    const result = runConvertPreflight({
      markdown: '# OK\n\nText',
      renderedHtml: '<h1>OK</h1><p>Text</p>',
      targetId: 'github',
      estimatedLocalAssetBytes: 0,
    });

    expect(result.severity).toBe('ok');
  });
});
