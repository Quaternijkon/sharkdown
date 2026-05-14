import { describe, expect, it } from 'vitest';

import { createHtmlFragmentArtifact, normalizeHtmlForTarget } from './htmlFragment';

describe('html fragment conversion', () => {
  it('removes scripts and event handlers from copied fragments', () => {
    const html = '<article><h1 onclick="x()">Hi</h1><script>alert(1)</script></article>';
    const normalized = normalizeHtmlForTarget(html, 'wechat');

    expect(normalized).toContain('<h1>Hi</h1>');
    expect(normalized).not.toContain('script');
    expect(normalized).not.toContain('onclick');
  });

  it('creates html-fragment artifacts with source metadata', () => {
    const artifact = createHtmlFragmentArtifact({
      html: '<p>Hello</p>',
      title: 'Hello',
      targetId: 'email',
      includesLocalAssets: false,
    });

    expect(artifact.kind).toBe('html-fragment');
    expect(artifact.mimeType).toBe('text/html;charset=utf-8');
    expect(artifact.text).toContain('<p>Hello</p>');
    expect(artifact.metadata.targetId).toBe('email');
  });
});
