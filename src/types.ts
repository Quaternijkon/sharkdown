export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'webp';

export interface DocumentState {
  markdown: string;
  themeId: string;
  width: number;
  padding: number;
  radius: number;
  fontScale: number;
  pixelRatio: number;
  background: string;
  allowRawHtml: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  cssVars: Record<string, string>;
  proseClassName?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  pixelRatio: number;
  backgroundColor: string;
  quality?: number;
}
