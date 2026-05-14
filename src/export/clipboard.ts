export class ClipboardImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClipboardImageError';
  }
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new ClipboardImageError('当前浏览器不支持写入图片到剪贴板，已降级为下载。');
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type || 'image/png']: blob,
      }),
    ]);
  } catch (err) {
    throw new ClipboardImageError(
      err instanceof Error ? `复制图片失败：${err.message}` : '复制图片失败，已降级为下载。',
    );
  }
}
