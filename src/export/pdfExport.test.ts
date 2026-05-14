import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildPdfPrintDocument,
  createPdfPrintStyles,
  exportPreviewAsPdf,
  resolvePdfSettings,
} from './pdfExport';

describe('text PDF print export', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('[data-sharkdown-print-root], [data-sharkdown-print-style]').forEach((node) => {
      node.remove();
    });
  });

  it('keeps PDF settings specific to browser print output', () => {
    expect(resolvePdfSettings({})).toMatchObject({
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 48,
      includeToc: true,
      includeHeaderFooter: true,
      includePageNumbers: true,
      title: 'Sharkdown',
    });
  });

  it('builds a selectable-text print document with clickable TOC links', () => {
    const source = document.createElement('article');
    source.className = 'markdown-export-frame sharkdown-prose sharkdown-prose--claude';
    source.style.setProperty('--preview-text', '#141413');
    source.style.setProperty('--preview-font-body', 'Georgia, serif');
    source.innerHTML = `
      <h1>Intro</h1>
      <p>Selectable markdown text.</p>
      <h2>Details</h2>
      <p>More text.</p>
    `;

    const settings = resolvePdfSettings({ title: 'Doc', includeToc: true });
    const printDocument = buildPdfPrintDocument(source, settings);

    expect(printDocument.textContent).toContain('Selectable markdown text.');
    expect(printDocument.querySelector('canvas')).toBeNull();
    expect(printDocument.querySelector('img[src^="data:"]')).toBeNull();
    expect(printDocument.querySelector('a[href="#pdf-heading-0"]')?.textContent).toContain('Intro');
    expect(printDocument.querySelector('#pdf-heading-1')?.textContent).toBe('Details');
    expect(printDocument.style.getPropertyValue('--preview-font-body')).toBe('Georgia, serif');
  });

  it('creates paged print CSS instead of image compression CSS', () => {
    const css = createPdfPrintStyles(
      resolvePdfSettings({
        pageSize: 'letter',
        orientation: 'landscape',
        margin: 36,
        includeHeaderFooter: true,
        includePageNumbers: true,
      }),
    );

    expect(css).toContain('@page');
    expect(css).toContain('size: letter landscape');
    expect(css).toContain('margin: 36pt');
    expect(css).toContain('counter(page)');
    expect(css).not.toContain('image/jpeg');
    expect(css).not.toContain('canvas');
  });

  it('prints the prepared text document without returning an image blob', async () => {
    const source = document.createElement('article');
    source.innerHTML = '<h1>Printable</h1><p>Text PDF</p>';
    Object.defineProperty(source, 'scrollHeight', { configurable: true, value: 600 });
    const printMock = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    const result = await exportPreviewAsPdf(source, resolvePdfSettings({ includeToc: false }));

    expect(result).toBeUndefined();
    expect(printMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-sharkdown-print-root]')).toBeNull();
  });
});
