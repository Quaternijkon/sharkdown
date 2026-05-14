import { describe, expect, it } from 'vitest';

import { getThemeById, themePresets } from './presets';

describe('theme presets', () => {
  it('ships the classic style preset themes', () => {
    expect(themePresets.map((theme) => theme.id)).toEqual([
      'claude',
      'gpt',
      'apple',
      'google',
      'wechat',
      'douyin',
      'black-gold',
      'github',
      'paper',
    ]);
  });

  it('defines export-safe CSS variables for each preset', () => {
    for (const theme of themePresets) {
      expect(theme.name).toBeTruthy();
      expect(theme.cssVars['--preview-bg']).toMatch(/^#/);
      expect(theme.cssVars['--preview-text']).toMatch(/^#/);
      expect(theme.cssVars['--preview-accent']).toMatch(/^#/);
      expect(theme.cssVars['--preview-font-body']).toMatch(/(sans-serif|serif)/);
      expect(theme.cssVars['--preview-font-code']).toContain('monospace');
      expect(theme.swatches?.length ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it('falls back to the GitHub theme for unknown ids', () => {
    expect(getThemeById('missing').id).toBe('claude');
  });

  it('keeps the Claude preset in an editorial serif style', () => {
    const claude = getThemeById('claude');

    expect(claude.cssVars['--preview-font-body']).toMatch(/^"Iowan Old Style"/);
    expect(claude.cssVars['--preview-font-body']).toContain('serif');
    expect(claude.cssVars['--preview-font-body']).not.toContain('sans-serif');
  });
});
