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

const CSS_PIXELS_PER_INCH = 96;
const POINTS_PER_INCH = 72;
const PDF_PAGE_SIZES_INCHES = {
  a4: { width: 8.2677, height: 11.6929 },
  letter: { width: 8.5, height: 11 },
} as const;

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
  root.style.setProperty('--sharkdown-pdf-background', resolveRenderedBackgroundColor(source, settings.backgroundColor));
  root.style.setProperty('--sharkdown-pdf-scale', resolvePrintScale(source, settings));

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
  const pageBackground = normalizeCssColor(settings.backgroundColor, DEFAULT_PDF_SETTINGS.backgroundColor);
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
  background: ${pageBackground};
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
    background: ${pageBackground} !important;
    height: auto !important;
    overflow: visible !important;
    width: 100% !important;
  }

  body {
    margin: 0 !important;
  }

  body > *:not([data-sharkdown-print-root]) {
    display: none !important;
  }

  [data-sharkdown-print-root] {
    background: ${pageBackground} !important;
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
    width: 100% !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  [data-sharkdown-print-root] .sharkdown-pdf-document {
    box-sizing: border-box !important;
    height: auto !important;
    margin-left: auto !important;
    margin-right: auto !important;
    max-width: unset !important;
    min-height: auto !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    zoom: var(--sharkdown-pdf-scale, 1);
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
  const initialSettings = resolvePdfSettings(partialSettings);
  await waitForPreviewReady(element, { maxHeight: Number.POSITIVE_INFINITY });
  const settings = {
    ...initialSettings,
    backgroundColor: resolveRenderedBackgroundColor(element, initialSettings.backgroundColor),
  };

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

function resolveRenderedBackgroundColor(source: HTMLElement, fallback: string): string {
  const computedBackground = window.getComputedStyle(source).backgroundColor;
  if (isOpaqueColor(computedBackground)) {
    return computedBackground;
  }
  return normalizeCssColor(fallback, DEFAULT_PDF_SETTINGS.backgroundColor);
}

function resolvePrintScale(source: HTMLElement, settings: PdfExportSettings): string {
  const previewWidth = resolveElementPixelWidth(source);
  const printableWidth = resolvePrintablePageWidth(settings);
  if (previewWidth <= 0 || printableWidth <= 0) {
    return '1';
  }
  return formatCssNumber(Math.min(1, printableWidth / previewWidth));
}

function resolveElementPixelWidth(source: HTMLElement): number {
  const inlineWidth = parseCssPixelLength(source.style.width);
  if (inlineWidth > 0) {
    return inlineWidth;
  }

  const rectWidth = source.getBoundingClientRect().width;
  if (rectWidth > 0) {
    return rectWidth;
  }

  const computedWidth = parseCssPixelLength(window.getComputedStyle(source).width);
  if (computedWidth > 0) {
    return computedWidth;
  }

  return source.offsetWidth;
}

function resolvePrintablePageWidth(settings: PdfExportSettings): number {
  const page = PDF_PAGE_SIZES_INCHES[settings.pageSize];
  const pageWidthInches = settings.orientation === 'landscape' ? page.height : page.width;
  const marginPixels = settings.margin * (CSS_PIXELS_PER_INCH / POINTS_PER_INCH);
  return Math.max(0, pageWidthInches * CSS_PIXELS_PER_INCH - marginPixels * 2);
}

function parseCssPixelLength(value: string): number {
  if (!value.trim().endsWith('px')) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCssNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function normalizeCssColor(value: string, fallback: string): string {
  const probe = document.createElement('span');
  probe.style.backgroundColor = value;
  return probe.style.backgroundColor || fallback;
}

function isOpaqueColor(value: string): boolean {
  return Boolean(value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)');
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
