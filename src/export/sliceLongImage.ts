import { toCanvas } from 'html-to-image';

export interface SliceExportOptions {
  pixelRatio: number;
  backgroundColor: string;
  sliceHeight?: number;
}

export async function exportSlicedPng(
  element: HTMLElement,
  options: SliceExportOptions,
): Promise<Blob[]> {
  const sliceHeight = options.sliceHeight ?? 1800;
  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: options.pixelRatio,
    backgroundColor: options.backgroundColor,
    style: {
      transform: 'none',
    },
  });

  const slices: Blob[] = [];
  for (let y = 0; y < canvas.height; y += sliceHeight) {
    const height = Math.min(sliceHeight, canvas.height - y);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = height;
    const context = sliceCanvas.getContext('2d');
    if (!context) {
      throw new Error('当前浏览器无法创建切片画布。');
    }
    context.drawImage(canvas, 0, y, canvas.width, height, 0, 0, canvas.width, height);
    slices.push(await canvasToPngBlob(sliceCanvas));
  }

  return slices;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('切片导出失败。请降低像素倍率后重试。'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}
