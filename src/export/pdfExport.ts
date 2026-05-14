import { toCanvas } from 'html-to-image';
import type { jsPDF as JsPDFClass } from 'jspdf';

import type { PdfExportSettings } from '../types';
import { waitForPreviewReady } from './waitForAssets';

type JsPDFDocument = InstanceType<typeof JsPDFClass>;

export interface PdfPageMetrics {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  headerHeight: number;
  footerHeight: number;
  contentWidth: number;
  contentHeight: number;
}

export interface CanvasSlice {
  sourceY: number;
  sourceHeight: number;
}

export interface PdfOutlineEntry {
  level: number;
  text: string;
  targetPage: number;
}

const DEFAULT_PDF_SETTINGS: PdfExportSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 48,
  includeToc: true,
  includeHeaderFooter: true,
  includePageNumbers: true,
  title: 'Sharkdown',
  pixelRatio: 2,
  quality: 0.92,
  backgroundColor: '#ffffff',
};

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export function resolvePdfSettings(settings: Partial<PdfExportSettings>): PdfExportSettings {
  return {
    ...DEFAULT_PDF_SETTINGS,
    ...settings,
    margin: clamp(settings.margin ?? DEFAULT_PDF_SETTINGS.margin, 18, 96),
    pixelRatio: clamp(settings.pixelRatio ?? DEFAULT_PDF_SETTINGS.pixelRatio, 1, 3),
    quality: clamp(settings.quality ?? DEFAULT_PDF_SETTINGS.quality, 0.72, 1),
    title: settings.title?.trim() || DEFAULT_PDF_SETTINGS.title,
  };
}

export function getPdfPageMetrics(settings: PdfExportSettings): PdfPageMetrics {
  const base = PAGE_SIZES[settings.pageSize];
  const pageWidth = settings.orientation === 'landscape' ? base.height : base.width;
  const pageHeight = settings.orientation === 'landscape' ? base.width : base.height;
  const headerHeight = settings.includeHeaderFooter ? 30 : 0;
  const footerHeight = settings.includeHeaderFooter || settings.includePageNumbers ? 34 : 0;
  const contentWidth = pageWidth - settings.margin * 2;
  const contentHeight = pageHeight - settings.margin * 2 - headerHeight - footerHeight;

  return {
    pageWidth,
    pageHeight,
    margin: settings.margin,
    headerHeight,
    footerHeight,
    contentWidth,
    contentHeight,
  };
}

export function paginateCanvas({
  canvasWidth,
  canvasHeight,
  contentWidthPt,
  contentHeightPt,
}: {
  canvasWidth: number;
  canvasHeight: number;
  contentWidthPt: number;
  contentHeightPt: number;
}): CanvasSlice[] {
  const sourceHeightPerPage = Math.max(1, Math.floor((contentHeightPt / contentWidthPt) * canvasWidth));
  const slices: CanvasSlice[] = [];

  for (let sourceY = 0; sourceY < canvasHeight; sourceY += sourceHeightPerPage) {
    slices.push({
      sourceY,
      sourceHeight: Math.min(sourceHeightPerPage, canvasHeight - sourceY),
    });
  }

  return slices;
}

export function collectPdfOutline(
  element: HTMLElement,
  sourceHeightPerPage: number,
  contentPageOffset = 0,
): PdfOutlineEntry[] {
  const rootTop = element.getBoundingClientRect().top;
  return Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .map((heading) => {
      const text = (heading.textContent ?? '').replace(/\s+/g, ' ').trim();
      const level = Number(heading.tagName.slice(1));
      const top = heading.getBoundingClientRect().top - rootTop + element.scrollTop;
      return {
        level,
        text,
        targetPage: contentPageOffset + Math.floor(Math.max(0, top) / sourceHeightPerPage) + 1,
      };
    })
    .filter((entry) => entry.text.length > 0);
}

export async function exportPreviewAsPdf(
  element: HTMLElement,
  partialSettings: Partial<PdfExportSettings>,
): Promise<Blob> {
  const settings = resolvePdfSettings(partialSettings);
  await waitForPreviewReady(element);

  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: settings.pixelRatio,
    backgroundColor: settings.backgroundColor,
    style: {
      transform: 'none',
    },
  });
  const metrics = getPdfPageMetrics(settings);
  const slices = paginateCanvas({
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    contentWidthPt: metrics.contentWidth,
    contentHeightPt: metrics.contentHeight,
  });
  const sourceHeightPerPage = slices[0]?.sourceHeight || canvas.height;
  const preliminaryOutline = collectPdfOutline(element, sourceHeightPerPage, 0);
  const tocPageCount = settings.includeToc ? getTocPageCount(preliminaryOutline, metrics) : 0;
  const outline = collectPdfOutline(element, sourceHeightPerPage, tocPageCount);
  const totalPages = tocPageCount + slices.length;
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    unit: 'pt',
    format: settings.pageSize,
    orientation: settings.orientation,
    compress: true,
  });

  let hasPage = false;
  if (settings.includeToc && outline.length > 0) {
    renderTocPages(pdf, outline, settings, metrics, totalPages);
    hasPage = true;
  }

  slices.forEach((slice, index) => {
    if (hasPage) {
      pdf.addPage();
    }
    hasPage = true;
    renderHeaderFooter(pdf, settings, metrics, tocPageCount + index + 1, totalPages);
    addCanvasSlice(pdf, canvas, slice, metrics, settings.quality);
  });

  return pdf.output('blob');
}

function getTocPageCount(outline: PdfOutlineEntry[], metrics: PdfPageMetrics): number {
  if (outline.length === 0) {
    return 0;
  }
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentHeight - 52) / 24));
  return Math.ceil(outline.length / rowsPerPage);
}

function renderTocPages(
  pdf: JsPDFDocument,
  outline: PdfOutlineEntry[],
  settings: PdfExportSettings,
  metrics: PdfPageMetrics,
  totalPages: number,
): void {
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentHeight - 52) / 24));
  const tocPages = getTocPageCount(outline, metrics);

  for (let pageIndex = 0; pageIndex < tocPages; pageIndex += 1) {
    if (pageIndex > 0) {
      pdf.addPage();
    }
    renderHeaderFooter(pdf, settings, metrics, pageIndex + 1, totalPages);

    const rows = outline.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);
    const { dataUrl, links } = renderTocCanvas(rows, settings, metrics, pageIndex + 1, tocPages);
    pdf.addImage(dataUrl, 'PNG', 0, 0, metrics.pageWidth, metrics.pageHeight, undefined, 'FAST');
    for (const link of links) {
      pdf.link(link.x, link.y, link.width, link.height, { pageNumber: link.targetPage });
    }
  }
}

function addCanvasSlice(
  pdf: JsPDFDocument,
  sourceCanvas: HTMLCanvasElement,
  slice: CanvasSlice,
  metrics: PdfPageMetrics,
  quality: number,
): void {
  const sliceCanvas = document.createElement('canvas');
  sliceCanvas.width = sourceCanvas.width;
  sliceCanvas.height = slice.sourceHeight;
  const context = sliceCanvas.getContext('2d');
  if (!context) {
    throw new Error('浏览器无法创建 PDF 分页画布。');
  }
  context.drawImage(
    sourceCanvas,
    0,
    slice.sourceY,
    sourceCanvas.width,
    slice.sourceHeight,
    0,
    0,
    sourceCanvas.width,
    slice.sourceHeight,
  );

  const imageHeight = (slice.sourceHeight / sourceCanvas.width) * metrics.contentWidth;
  const dataUrl = sliceCanvas.toDataURL('image/jpeg', quality);
  pdf.addImage(
    dataUrl,
    'JPEG',
    metrics.margin,
    metrics.margin + metrics.headerHeight,
    metrics.contentWidth,
    imageHeight,
    undefined,
    'FAST',
  );
}

function renderHeaderFooter(
  pdf: JsPDFDocument,
  settings: PdfExportSettings,
  metrics: PdfPageMetrics,
  pageNumber: number,
  totalPages: number,
): void {
  if (settings.includeHeaderFooter) {
    const header = renderTextCanvas({
      width: metrics.contentWidth,
      height: 22,
      text: settings.title,
      align: 'left',
      fontSize: 12,
      color: '#6b7280',
    });
    pdf.addImage(header, 'PNG', metrics.margin, 20, metrics.contentWidth, 22, undefined, 'FAST');
  }

  if (settings.includePageNumbers) {
    const footer = renderTextCanvas({
      width: metrics.contentWidth,
      height: 22,
      text: `Page ${pageNumber} / ${totalPages}`,
      align: 'center',
      fontSize: 11,
      color: '#6b7280',
    });
    pdf.addImage(
      footer,
      'PNG',
      metrics.margin,
      metrics.pageHeight - metrics.margin + 10,
      metrics.contentWidth,
      22,
      undefined,
      'FAST',
    );
  }
}

function renderTocCanvas(
  rows: PdfOutlineEntry[],
  settings: PdfExportSettings,
  metrics: PdfPageMetrics,
  pageIndex: number,
  pageCount: number,
): {
  dataUrl: string;
  links: Array<{ x: number; y: number; width: number; height: number; targetPage: number }>;
} {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(metrics.pageWidth * scale);
  canvas.height = Math.ceil(metrics.pageHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('浏览器无法创建 PDF 目录画布。');
  }
  context.scale(scale, scale);
  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, metrics.pageWidth, metrics.pageHeight);

  const startX = metrics.margin;
  let cursorY = metrics.margin + metrics.headerHeight;
  context.fillStyle = '#111827';
  context.font = '700 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText(pageCount > 1 ? `目录 ${pageIndex}/${pageCount}` : '目录', startX, cursorY + 4);
  cursorY += 42;

  const links: Array<{ x: number; y: number; width: number; height: number; targetPage: number }> = [];
  for (const row of rows) {
    const rowHeight = 24;
    const indent = Math.max(0, row.level - 1) * 16;
    const pageText = String(row.targetPage);
    context.fillStyle = '#111827';
    context.font = '500 12px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(truncateCanvasText(context, row.text, metrics.contentWidth - indent - 50), startX + indent, cursorY);
    context.fillStyle = '#6b7280';
    context.textAlign = 'right';
    context.fillText(pageText, startX + metrics.contentWidth, cursorY);
    context.textAlign = 'left';
    links.push({
      x: startX,
      y: cursorY - 15,
      width: metrics.contentWidth,
      height: rowHeight,
      targetPage: row.targetPage,
    });
    cursorY += rowHeight;
  }

  return { dataUrl: canvas.toDataURL('image/png'), links };
}

function renderTextCanvas({
  width,
  height,
  text,
  align,
  fontSize,
  color,
}: {
  width: number;
  height: number;
  text: string;
  align: CanvasTextAlign;
  fontSize: number;
  color: string;
}): string {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('浏览器无法创建 PDF 文本画布。');
  }

  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);
  context.fillStyle = color;
  context.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  context.textBaseline = 'middle';
  context.textAlign = align;
  const x = align === 'center' ? width / 2 : align === 'right' ? width : 0;
  context.fillText(truncateCanvasText(context, text, width), x, height / 2);
  return canvas.toDataURL('image/png');
}

function truncateCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let next = text;
  while (next.length > 1 && context.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
