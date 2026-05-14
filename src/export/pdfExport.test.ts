import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  collectPdfOutline,
  exportPreviewAsPdf,
  getPdfPageMetrics,
  paginateCanvas,
  resolvePdfSettings,
} from './pdfExport';

const pdfExportMocks = vi.hoisted(() => {
  const addImageMock = vi.fn();
  const addPageMock = vi.fn();
  const linkMock = vi.fn();
  const outputMock = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));

  return {
    toCanvasMock: vi.fn(),
    addImageMock,
    addPageMock,
    linkMock,
    outputMock,
    jsPDFMock: vi.fn(function MockJsPdf() {
      return {
      addImage: addImageMock,
      addPage: addPageMock,
      link: linkMock,
      output: outputMock,
      };
    }),
  };
});

vi.mock('html-to-image', () => ({
  toCanvas: pdfExportMocks.toCanvasMock,
}));

vi.mock('jspdf', () => ({
  jsPDF: pdfExportMocks.jsPDFMock,
}));

describe('pdf export planning helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps PDF settings format-specific with sensible defaults', () => {
    expect(resolvePdfSettings({})).toMatchObject({
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 48,
      includeToc: true,
      includeHeaderFooter: true,
      includePageNumbers: true,
    });
  });

  it('paginates a tall canvas by the available PDF content area', () => {
    const metrics = getPdfPageMetrics({
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 48,
      includeHeaderFooter: true,
      includePageNumbers: true,
      includeToc: true,
      title: 'Doc',
      pixelRatio: 2,
      quality: 0.92,
      backgroundColor: '#ffffff',
    });

    const slices = paginateCanvas({
      canvasWidth: 1200,
      canvasHeight: 3200,
      contentWidthPt: metrics.contentWidth,
      contentHeightPt: metrics.contentHeight,
    });

    expect(slices.length).toBeGreaterThan(1);
    expect(slices[0].sourceY).toBe(0);
    expect(slices.at(-1)?.sourceY).toBeLessThan(3200);
  });

  it('collects heading targets as clickable outline entries', () => {
    const root = document.createElement('article');
    root.innerHTML = `
      <h1 style="margin-top: 0">Title</h1>
      <p style="height: 900px">body</p>
      <h2>Details</h2>
    `;
    Object.defineProperty(root, 'getBoundingClientRect', {
      value: () => ({ top: 100 }),
    });
    Object.defineProperty(root.querySelector('h1'), 'getBoundingClientRect', {
      value: () => ({ top: 100 }),
    });
    Object.defineProperty(root.querySelector('h2'), 'getBoundingClientRect', {
      value: () => ({ top: 1020 }),
    });

    expect(collectPdfOutline(root, 800, 2)).toEqual([
      { level: 1, text: 'Title', targetPage: 3 },
      { level: 2, text: 'Details', targetPage: 4 },
    ]);
  });

  it('applies PDF image quality to content page compression', async () => {
    const root = document.createElement('article');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = 400;
    sourceCanvas.height = 300;
    pdfExportMocks.toCanvasMock.mockResolvedValue(sourceCanvas);
    const context = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    const toDataUrlSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,content');

    try {
      const result = await exportPreviewAsPdf(root, {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 48,
        includeToc: false,
        includeHeaderFooter: false,
        includePageNumbers: false,
        title: 'Doc',
        pixelRatio: 1,
        quality: 0.81,
        backgroundColor: '#ffffff',
      });

      expect(result.type).toBe('application/pdf');
      expect(toDataUrlSpy).toHaveBeenCalledWith('image/jpeg', 0.81);
      expect(pdfExportMocks.addImageMock).toHaveBeenCalledWith(
        'data:image/jpeg;base64,content',
        'JPEG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        undefined,
        'FAST',
      );
    } finally {
      getContextSpy.mockRestore();
      toDataUrlSpy.mockRestore();
    }
  });
});
