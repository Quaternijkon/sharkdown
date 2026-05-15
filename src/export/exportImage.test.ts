import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exportPreviewAsBlob } from './exportImage';

const htmlToImageMocks = vi.hoisted(() => ({
  toBlobMock: vi.fn(),
  toCanvasMock: vi.fn(),
  toSvgMock: vi.fn(),
}));

vi.mock('html-to-image', () => ({
  toBlob: htmlToImageMocks.toBlobMock,
  toCanvas: htmlToImageMocks.toCanvasMock,
  toSvg: htmlToImageMocks.toSvgMock,
}));

const { toBlobMock, toCanvasMock, toSvgMock } = htmlToImageMocks;

describe('exportPreviewAsBlob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports PNG through html-to-image toBlob with stable options', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    toBlobMock.mockResolvedValue(blob);
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });

    const result = await exportPreviewAsBlob(root, {
      format: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    expect(result).toBe(blob);
    expect(toBlobMock).toHaveBeenCalledWith(
      root,
      expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      }),
    );
  });

  it('uses the rendered preview background instead of a stale canvas background', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    toBlobMock.mockResolvedValue(blob);
    const root = document.createElement('div');
    root.style.backgroundColor = 'rgb(11, 11, 16)';
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });

    await exportPreviewAsBlob(root, {
      format: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    expect(toBlobMock).toHaveBeenCalledWith(
      root,
      expect.objectContaining({
        backgroundColor: 'rgb(11, 11, 16)',
      }),
    );
  });

  it('exports JPEG as a Blob without using data URLs', async () => {
    const canvas = document.createElement('canvas');
    canvas.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(['jpg'], { type: 'image/jpeg' }));
    });
    toCanvasMock.mockResolvedValue(canvas);
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });

    const result = await exportPreviewAsBlob(root, {
      format: 'jpeg',
      pixelRatio: 3,
      backgroundColor: '#f8fafc',
      quality: 0.92,
    });

    expect(result.type).toBe('image/jpeg');
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
    expect(toCanvasMock).toHaveBeenCalledWith(root, expect.objectContaining({ pixelRatio: 3 }));
  });

  it('converts SVG data URLs into image/svg+xml blobs', async () => {
    toSvgMock.mockResolvedValue(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg></svg>')}`,
    );
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });

    const result = await exportPreviewAsBlob(root, {
      format: 'svg',
      pixelRatio: 1,
      backgroundColor: '#ffffff',
    });

    expect(result.type).toBe('image/svg+xml');
    expect(await result.text()).toBe('<svg></svg>');
  });
});
