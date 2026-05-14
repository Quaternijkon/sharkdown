export type ImageExportFormat = 'png' | 'jpeg' | 'svg' | 'webp';
export type ExportFormat = ImageExportFormat | 'pdf';
export type PdfPageSize = 'a4' | 'letter';
export type PdfOrientation = 'portrait' | 'landscape';

export interface DocumentState {
  markdown: string;
  themeId: string;
  width: number;
  padding: number;
  radius: number;
  fontScale: number;
  background: string;
  allowRawHtml: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  cssVars: Record<string, string>;
  swatches?: string[];
  proseClassName?: string;
}

export interface ExportOptions {
  format: ImageExportFormat;
  pixelRatio: number;
  backgroundColor: string;
  quality?: number;
}

export interface ImageExportSettings {
  format: ImageExportFormat;
  pixelRatio: number;
  quality: number;
  sliceHeight: number;
}

export interface PdfExportSettings {
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
  margin: number;
  includeToc: boolean;
  includeHeaderFooter: boolean;
  includePageNumbers: boolean;
  title: string;
  backgroundColor: string;
}
