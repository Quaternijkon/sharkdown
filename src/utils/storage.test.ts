import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadStoredState, saveStoredState } from './storage';

describe('local storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves and loads typed JSON state', () => {
    const state = { markdown: '# Test', themeId: 'github', pixelRatio: 2 };

    saveStoredState('test-key', state);

    expect(loadStoredState<typeof state>('test-key')).toEqual(state);
  });

  it('returns fallback when storage contains invalid JSON', () => {
    localStorage.setItem('bad-key', '{bad json');

    expect(loadStoredState('bad-key', { markdown: '' })).toEqual({ markdown: '' });
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => saveStoredState('blocked-key', { ok: true })).not.toThrow();
  });
});
