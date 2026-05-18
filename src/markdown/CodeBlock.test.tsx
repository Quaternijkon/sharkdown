import { describe, expect, it } from 'vitest';

import { getCodeHighlightTheme } from './codeHighlightTheme';

describe('getCodeHighlightTheme', () => {
  it('uses a dark Shiki theme for dark Sharkdown themes', () => {
    expect(getCodeHighlightTheme('douyin')).toBe('github-dark');
    expect(getCodeHighlightTheme('black-gold')).toBe('github-dark');
  });

  it('keeps the light Shiki theme for light themes', () => {
    expect(getCodeHighlightTheme('claude')).toBe('github-light');
    expect(getCodeHighlightTheme('github')).toBe('github-light');
  });
});
