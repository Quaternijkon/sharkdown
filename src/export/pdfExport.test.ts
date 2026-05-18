import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildPdfPrintDocument,
  createPdfPrintStyles,
  exportPreviewAsPdf,
  resolvePdfSettings,
  settingsFromPdfProfile,
} from './pdfExport';
import { getPdfProfile } from './pdfProfiles';

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

  it('maps PDF profiles onto text PDF settings without overwriting document metadata', () => {
    const profile = getPdfProfile('handout');

    expect(profile).toBeDefined();
    expect(settingsFromPdfProfile(profile!)).toMatchObject({
      pageSize: 'a4',
      orientation: 'portrait',
      includeToc: false,
      includeHeaderFooter: true,
      includePageNumbers: true,
    });
    expect(settingsFromPdfProfile(profile!)).not.toHaveProperty('title');
    expect(settingsFromPdfProfile(profile!)).not.toHaveProperty('backgroundColor');
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

  it('uses the rendered preview background for print pages when the theme is dark', () => {
    const source = document.createElement('article');
    source.className = 'markdown-export-frame sharkdown-prose sharkdown-prose--douyin';
    source.style.backgroundColor = 'rgb(11, 11, 16)';
    source.innerHTML = '<h1>Dark export</h1><p>Readable text PDF.</p>';

    const settings = resolvePdfSettings({
      backgroundColor: '#ffffff',
      includeToc: false,
      includeHeaderFooter: false,
    });
    const printDocument = buildPdfPrintDocument(source, settings);

    expect(printDocument.style.getPropertyValue('--sharkdown-pdf-background')).toBe('rgb(11, 11, 16)');
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

  it('prints a concrete page background instead of relying on a scoped custom property', () => {
    const css = createPdfPrintStyles(
      resolvePdfSettings({
        backgroundColor: 'rgb(11, 11, 16)',
        includeHeaderFooter: false,
        includePageNumbers: false,
      }),
    );

    expect(css).toContain('background: rgb(11, 11, 16)');
    expect(css).not.toContain('html,\n  body {\n    background: var(--sharkdown-pdf-background');
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

  it('prepares exported PDFs with the rendered background even when settings still carry white', async () => {
    const source = document.createElement('article');
    source.style.backgroundColor = 'rgb(11, 11, 16)';
    source.innerHTML = '<h1>Printable</h1><p>Dark text PDF</p>';
    Object.defineProperty(source, 'scrollHeight', { configurable: true, value: 600 });
    let printStyle = '';
    const printMock = vi.spyOn(window, 'print').mockImplementation(() => {
      printStyle = document.querySelector('[data-sharkdown-print-style]')?.textContent ?? '';
      expect(
        document
          .querySelector<HTMLElement>('[data-sharkdown-print-root]')
          ?.style.getPropertyValue('--sharkdown-pdf-background'),
      ).toBe('rgb(11, 11, 16)');
    });

    await exportPreviewAsPdf(
      source,
      resolvePdfSettings({
        backgroundColor: '#ffffff',
        includeToc: false,
        includeHeaderFooter: false,
      }),
    );

    expect(printMock).toHaveBeenCalledTimes(1);
    expect(printStyle).toContain('background: rgb(11, 11, 16)');
  });
});
