import { describe, expect, it } from 'vitest';

import {
  createLocalImageMarkdown,
  parseLocalImageReference,
  readBlobAsDataUrl,
  sanitizeImageFileName,
} from './localImages';

describe('local image markdown references', () => {
  it('inserts a short local image reference instead of a data URL', () => {
    const markdown = createLocalImageMarkdown({
      id: 'img_123',
      fileName: 'diagram [draft].png',
    });

    expect(markdown).toBe('![diagram draft.png](local-image://img_123/diagram%20draft.png)');
    expect(markdown).not.toContain('base64');
    expect(markdown.length).toBeLessThan(90);
  });

  it('parses local image references back to ids and names', () => {
    expect(parseLocalImageReference('local-image://img_123/diagram%20draft.png')).toEqual({
      id: 'img_123',
      fileName: 'diagram draft.png',
    });
  });

  it('sanitizes file names for markdown alt text and local URLs', () => {
    expect(sanitizeImageFileName('a[b](c)# d.png')).toBe('abc d.png');
  });

  it('converts stored image blobs into export-friendly data URLs', async () => {
    const dataUrl = await readBlobAsDataUrl(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
