import { describe, expect, it } from 'vitest';

import { getPlatformPreset, listPlatformPresets } from './platformPresets';

describe('platform conversion presets', () => {
  it('provides compact offline presets for social media cards', () => {
    const presets = listPlatformPresets();

    expect(presets.map((preset) => preset.id)).toEqual(
      expect.arrayContaining(['wechat', 'xiaohongshu', 'douyin', 'github', 'email', 'print']),
    );
    expect(getPlatformPreset('xiaohongshu')?.canvas.width).toBe(1080);
    expect(getPlatformPreset('douyin')?.canvas.aspectRatio).toBe('9:16');
  });

  it('does not define any network upload action', () => {
    for (const preset of listPlatformPresets()) {
      expect(preset.delivery).not.toContain('upload');
      expect(preset.requiresNetwork).toBe(false);
    }
  });
});
