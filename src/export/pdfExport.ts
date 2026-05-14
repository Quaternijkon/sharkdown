import type { PdfExportSettings } from '../types';
import type { PdfProfile } from './pdfProfiles';
import { waitForPreviewReady } from './waitForAssets';

interface PdfHeadingEntry {
  id: string;
  level: number;
  text: string;
}

const DEFAULT_PDF_SETTINGS: PdfExportSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 48,
  includeToc: true,
  includeHeaderFooter: true,
  includePageNumbers: true,
  title: 'Sharkdown',
  backgroundColor: '#ffffff',
};

export function resolvePdfSettings(settings: Partial<PdfExportSettings>): PdfExportSettings {
  return {
    ...DEFAULT_PDF_SETTINGS,
    ...settings,
    margin: clamp(settings.margin ?? DEFAULT_PDF_SETTINGS.margin, 18, 96),
    title: settings.title?.trim() || DEFAULT_PDF_SETTINGS.title,
    backgroundColor: settings.backgroundColor?.trim() || DEFAULT_PDF_SETTINGS.backgroundColor,
  };
}

export function settingsFromPdfProfile(
  profile: PdfProfile,
): Pick<
  PdfExportSettings,
  'pageSize' | 'orientation' | 'margin' | 'includeToc' | 'includeHeaderFooter' | 'includePageNumbers'
> {
  return {
    pageSize: profile.page.size === 'A4' ? 'a4' : 'letter',
    orientation: 'portrait',
    margin: Math.round(
      ((profile.page.marginTopMm +
        profile.page.marginRightMm +
        profile.page.marginBottomMm +
        profile.page.marginLeftMm) /
        4) *
        2.83465,
    ),
    includeToc: profile.features.toc,
    includeHeaderFooter: profile.features.header || profile.features.footer,
    includePageNumbers: profile.features.footer,
  };
}

export function buildPdfPrintDocument(source: HTMLElement, settings: PdfExportSettings): HTMLElement {
  const root = document.createElement('section');
  root.setAttribute('data-sharkdown-print-root', '');
  root.className = 'sharkdown-pdf-print-root';
  copyPreviewVariables(source, root);
  root.style.setProperty('--sharkdown-pdf-background', settings.backgroundColor);

  if (settings.includeHeaderFooter) {
    root.append(createPrintTitle(settings));
  }

  const documentClone = source.cloneNode(true) as HTMLElement;
  documentClone.classList.add('sharkdown-pdf-document');
  documentClone.removeAttribute('id');

  const headings = prepareHeadings(documentClone);
  if (settings.includeToc && headings.length > 0) {
    root.append(createToc(headings));
  }

  root.append(documentClone);
  return root;
}

export function createPdfPrintStyles(settings: PdfExportSettings): string {
  const pageNumberRule = settings.includePageNumbers
    ? `
    @bottom-center {
      color: #6b7280;
      content: "Page " counter(page) " / " counter(pages);
      font: 9pt system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }`
    : '';
  const headerRule = settings.includeHeaderFooter
    ? `
    @top-left {
      color: #6b7280;
      content: "${escapeCssString(settings.title)}";
      font: 9pt system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }`
    : '';

  return `
@page {
  size: ${settings.pageSize} ${settings.orientation};
  margin: ${settings.margin}pt;
  ${headerRule}
  ${pageNumberRule}
}

@media screen {
  [data-sharkdown-print-root] {
    height: 1px !important;
    left: -100000px !important;
    overflow: hidden !important;
    pointer-events: none !important;
    position: fixed !important;
    top: 0 !important;
    width: 1px !important;
  }
}

@media print {
  html,
  body {
    background: var(--sharkdown-pdf-background, #ffffff) !important;
    height: auto !important;
    overflow: visible !important;
    width: auto !important;
  }

  body {
    margin: 0 !important;
  }

  body > *:not([data-sharkdown-print-root]) {
    display: none !important;
  }

  [data-sharkdown-print-root] {
    background: var(--sharkdown-pdf-background, #ffffff) !important;
    box-sizing: border-box !important;
    color: var(--preview-text, #111827) !important;
    display: block !important;
    height: auto !important;
    left: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    pointer-events: auto !important;
    position: static !important;
    top: auto !important;
    width: auto !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  [data-sharkdown-print-root] .markdown-export-frame,
  [data-sharkdown-print-root] .sharkdown-pdf-document {
    background: transparent !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    width: auto !important;
  }

  .sharkdown-pdf-title {
    border-bottom: 1px solid var(--preview-border, #d1d5db);
    color: var(--preview-muted, #6b7280);
    font: 10pt system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    margin: 0 0 18pt;
    padding: 0 0 8pt;
  }

  .sharkdown-pdf-toc {
    break-after: page;
    color: var(--preview-text, #111827);
    font-family: var(--preview-font-body, system-ui, sans-serif);
    margin: 0;
  }

  .sharkdown-pdf-toc h2 {
    color: var(--preview-text, #111827);
    font-family: var(--preview-font-heading, system-ui, sans-serif);
    font-size: 22pt;
    line-height: 1.2;
    margin: 0 0 16pt;
  }

  .sharkdown-pdf-toc ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .sharkdown-pdf-toc li {
    border-bottom: 1px dotted var(--preview-border, #d1d5db);
    margin: 0;
    padding: 5pt 0;
  }

  .sharkdown-pdf-toc a {
    color: var(--preview-text, #111827);
    text-decoration: none;
  }

  .sharkdown-pdf-toc-level-2 {
    padding-left: 12pt !important;
  }

  .sharkdown-pdf-toc-level-3,
  .sharkdown-pdf-toc-level-4,
  .sharkdown-pdf-toc-level-5,
  .sharkdown-pdf-toc-level-6 {
    padding-left: 24pt !important;
  }

  [data-sharkdown-print-root] a {
    color: var(--preview-accent, #2563eb);
  }

  [data-sharkdown-print-root] :is(h1, h2, h3, h4, h5, h6) {
    break-after: avoid-page;
    break-inside: avoid-page;
    page-break-after: avoid;
  }

  [data-sharkdown-print-root] :is(blockquote, figure, img, pre, svg, table) {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  [data-sharkdown-print-root] img,
  [data-sharkdown-print-root] svg {
    max-width: 100% !important;
  }

  [data-sharkdown-print-root] pre {
    overflow: visible !important;
    white-space: pre-wrap !important;
  }

  [data-sharkdown-print-root] table {
    display: table !important;
    overflow: visible !important;
  }
}
`;
}

export async function exportPreviewAsPdf(
  element: HTMLElement,
  partialSettings: Partial<PdfExportSettings>,
): Promise<void> {
  const settings = resolvePdfSettings(partialSettings);
  await waitForPreviewReady(element, { maxHeight: Number.POSITIVE_INFINITY });

  const printRoot = buildPdfPrintDocument(element, settings);
  const style = document.createElement('style');
  style.setAttribute('data-sharkdown-print-style', '');
  style.textContent = createPdfPrintStyles(settings);

  document.head.append(style);
  document.body.append(printRoot);

  try {
    window.print();
  } finally {
    printRoot.remove();
    style.remove();
  }
}

function createPrintTitle(settings: PdfExportSettings): HTMLElement {
  const title = document.createElement('div');
  title.className = 'sharkdown-pdf-title';
  title.textContent = settings.title;
  return title;
}

function copyPreviewVariables(source: HTMLElement, target: HTMLElement): void {
  for (let index = 0; index < source.style.length; index += 1) {
    const property = source.style.item(index);
    if (property.startsWith('--preview-')) {
      target.style.setProperty(property, source.style.getPropertyValue(property));
    }
  }
}

function prepareHeadings(root: HTMLElement): PdfHeadingEntry[] {
  return Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .map((heading, index) => {
      const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
      const id = `pdf-heading-${index}`;
      heading.id = id;
      return {
        id,
        level: Number(heading.tagName.slice(1)),
        text,
      };
    })
    .filter((heading) => heading.text.length > 0);
}

function createToc(headings: PdfHeadingEntry[]): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'sharkdown-pdf-toc';
  nav.setAttribute('aria-label', '目录');

  const title = document.createElement('h2');
  title.textContent = '目录';
  nav.append(title);

  const list = document.createElement('ol');
  for (const heading of headings) {
    const item = document.createElement('li');
    item.className = `sharkdown-pdf-toc-level-${heading.level}`;
    const anchor = document.createElement('a');
    anchor.href = `#${heading.id}`;
    anchor.textContent = heading.text;
    item.append(anchor);
    list.append(item);
  }

  nav.append(list);
  return nav;
}

function escapeCssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n|\r|\f/g, ' ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
