export const MAX_EXPORT_HEIGHT = 16000;

export type PreviewReadinessCode =
  | 'CONTENT_TOO_TALL'
  | 'IMAGE_LOAD_FAILED'
  | 'IMAGE_TIMEOUT'
  | 'MERMAID_TIMEOUT';

export class PreviewReadinessError extends Error {
  code: PreviewReadinessCode;

  constructor(code: PreviewReadinessCode, message: string) {
    super(message);
    this.name = 'PreviewReadinessError';
    this.code = code;
  }
}

export interface WaitForPreviewReadyOptions {
  maxHeight?: number;
  timeoutMs?: number;
}

export async function waitForPreviewReady(
  element: HTMLElement,
  options: WaitForPreviewReadyOptions = {},
): Promise<void> {
  const maxHeight = options.maxHeight ?? MAX_EXPORT_HEIGHT;
  const timeoutMs = options.timeoutMs ?? 7000;

  if (element.scrollHeight > maxHeight) {
    throw new PreviewReadinessError(
      'CONTENT_TOO_TALL',
      `当前内容高度 ${element.scrollHeight}px 超过浏览器稳定导出的建议上限 ${maxHeight}px。`,
    );
  }

  await waitForFonts();
  await waitForImages(element, timeoutMs);
  await waitForMermaid(element, timeoutMs);
  await nextFrame();
}

async function waitForFonts(): Promise<void> {
  const fonts = document.fonts as FontFaceSet | undefined;
  if (fonts?.ready) {
    await fonts.ready;
  }
}

function waitForImages(element: HTMLElement, timeoutMs: number): Promise<void> {
  const images = Array.from(element.querySelectorAll('img')).filter((image) => !image.complete);

  if (images.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let pending = images.length;
    const cleanupCallbacks: Array<() => void> = [];
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new PreviewReadinessError(
          'IMAGE_TIMEOUT',
          '图片加载超时。远程图片可能没有响应，建议下载后以本地图片插入。',
        ),
      );
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timeout);
      for (const cleanupCallback of cleanupCallbacks) {
        cleanupCallback();
      }
    };

    const completeOne = () => {
      pending -= 1;
      if (pending === 0) {
        cleanup();
        resolve();
      }
    };

    for (const image of images) {
      const handleLoad = () => completeOne();
      const handleError = () => {
        cleanup();
        reject(
          new PreviewReadinessError(
            'IMAGE_LOAD_FAILED',
            `图片加载失败：${image.currentSrc || image.src || '未知图片'}。如果是远程图片，可能缺少 CORS 许可。`,
          ),
        );
      };

      image.addEventListener('load', handleLoad, { once: true });
      image.addEventListener('error', handleError, { once: true });
      cleanupCallbacks.push(() => {
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleError);
      });
    }
  });
}

function waitForMermaid(element: HTMLElement, timeoutMs: number): Promise<void> {
  if (!hasRenderingMermaid(element)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new PreviewReadinessError(
          'MERMAID_TIMEOUT',
          'Mermaid 图表渲染超时。请检查图表语法，或删除该图表后重试导出。',
        ),
      );
    }, timeoutMs);

    const check = () => {
      if (!hasRenderingMermaid(element)) {
        window.clearTimeout(timeout);
        resolve();
        return;
      }
      window.setTimeout(check, 50);
    };

    check();
  });
}

function hasRenderingMermaid(element: HTMLElement): boolean {
  return Array.from(element.querySelectorAll<HTMLElement>('[data-mermaid-status]')).some(
    (block) => block.dataset.mermaidStatus === 'rendering',
  );
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
