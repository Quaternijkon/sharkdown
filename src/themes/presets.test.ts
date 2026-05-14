import { describe, expect, it } from 'vitest';

import { getThemeById, themePresets } from './presets';

describe('theme presets', () => {
  it('ships the six required preset themes', () => {
    expect(themePresets.map((theme) => theme.id)).toEqual([
      'github',
      'dark',
      'paper',
      'minimal',
      'tech',
      'academic',
    ]);
  });

  it('defines export-safe CSS variables for each preset', () => {
    for (const theme of themePresets) {
      expect(theme.name).toBeTruthy();
      expect(theme.cssVars['--preview-bg']).toMatch(/^#/);
      expect(theme.cssVars['--preview-text']).toMatch(/^#/);
      expect(theme.cssVars['--preview-accent']).toMatch(/^#/);
      expect(theme.cssVars['--preview-font-body']).toContain('sans-serif');
      expect(theme.cssVars['--preview-font-code']).toContain('monospace');
    }
  });

  it('falls back to the GitHub theme for unknown ids', () => {
    expect(getThemeById('missing').id).toBe('github');
  });
});
