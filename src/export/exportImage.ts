import { toBlob, toCanvas, toSvg } from 'html-to-image';

import type { ExportFormat, ExportOptions } from '../types';
import { waitForPreviewReady } from './waitForAssets';

export async function exportPreviewAsBlob(
  element: HTMLElement,
  options: ExportOptions,
): Promise<Blob> {
  await waitForPreviewReady(element);

  const imageOptions = {
    cacheBust: true,
    pixelRatio: options.pixelRatio,
    backgroundColor: resolveExportBackgroundColor(element, options.backgroundColor),
    style: {
      transform: 'none',
    },
  };

  if (options.format === 'png') {
    const blob = await toBlob(element, imageOptions);
    if (!blob) {
      throw new Error('浏览器没有生成 PNG Blob。请降低像素倍率或减少内容后重试。');
    }
    return blob;
  }

  if (options.format === 'jpeg' || options.format === 'webp') {
    const canvas = await toCanvas(element, imageOptions);
    return canvasToBlob(canvas, mimeForFormat(options.format), options.quality ?? 0.92);
  }

  const svgDataUrl = await toSvg(element, imageOptions);
  return dataUrlToBlob(svgDataUrl, 'image/svg+xml');
}

export function resolveExportBackgroundColor(element: HTMLElement, fallbackColor: string): string {
  const computedColor = window.getComputedStyle(element).backgroundColor;
  if (computedColor && computedColor !== 'transparent' && computedColor !== 'rgba(0, 0, 0, 0)') {
    return computedColor;
  }
  return fallbackColor;
}

export function exportExtension(format: ExportFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

function mimeForFormat(format: Extract<ExportFormat, 'jpeg' | 'webp'>): string {
  return format === 'jpeg' ? 'image/jpeg' : 'image/webp';
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!canvas.toBlob) {
      reject(new Error('当前浏览器不支持 canvas.toBlob，无法稳定导出图片。'));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('浏览器未能生成图片 Blob。请降低像素倍率后重试。'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function dataUrlToBlob(dataUrl: string, fallbackType: string): Blob {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    return new Blob([dataUrl], { type: fallbackType });
  }

  const meta = dataUrl.slice(0, commaIndex);
  const data = dataUrl.slice(commaIndex + 1);
  const mimeType = meta.match(/^data:([^;,]+)/)?.[1] ?? fallbackType;
  const isBase64 = meta.includes(';base64');
  const body = isBase64 ? atob(data) : decodeURIComponent(data);

  return new Blob([body], { type: mimeType });
}
