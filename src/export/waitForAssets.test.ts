import { describe, expect, it, vi } from 'vitest';

import { MAX_EXPORT_HEIGHT, waitForPreviewReady } from './waitForAssets';

describe('waitForPreviewReady', () => {
  it('waits for pending images before resolving', async () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { configurable: true, value: false });
    root.append(image);

    const ready = waitForPreviewReady(root);
    setTimeout(() => image.dispatchEvent(new Event('load')), 0);

    await expect(ready).resolves.toBeUndefined();
  });

  it('waits for Mermaid blocks to leave rendering state', async () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const block = document.createElement('div');
    block.dataset.mermaidStatus = 'rendering';
    root.append(block);

    const ready = waitForPreviewReady(root, { timeoutMs: 1000 });
    setTimeout(() => {
      block.dataset.mermaidStatus = 'done';
    }, 0);

    await expect(ready).resolves.toBeUndefined();
  });

  it('rejects documents that exceed the maximum export height', async () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', {
      configurable: true,
      value: MAX_EXPORT_HEIGHT + 1,
    });

    await expect(waitForPreviewReady(root)).rejects.toMatchObject({
      code: 'CONTENT_TOO_TALL',
    });
  });

  it('rejects when an image fails before export', async () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { configurable: true, value: false });
    image.src = 'https://example.invalid/image.png';
    root.append(image);

    const ready = waitForPreviewReady(root);
    setTimeout(() => image.dispatchEvent(new Event('error')), 0);

    await expect(ready).rejects.toMatchObject({
      code: 'IMAGE_LOAD_FAILED',
    });
  });

  it('rejects when a local image reference cannot be resolved before export', async () => {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const placeholder = document.createElement('span');
    placeholder.className = 'sharkdown-local-image-missing';
    root.append(placeholder);

    await expect(waitForPreviewReady(root)).rejects.toMatchObject({
      code: 'IMAGE_LOAD_FAILED',
    });
  });

  it('times out while local image references are still resolving', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
      const placeholder = document.createElement('span');
      placeholder.className = 'sharkdown-local-image-loading';
      root.append(placeholder);

      const ready = waitForPreviewReady(root, { timeoutMs: 500 });
      const expectation = expect(ready).rejects.toMatchObject({
        code: 'IMAGE_TIMEOUT',
      });
      await vi.advanceTimersByTimeAsync(501);

      await expectation;
    } finally {
      vi.useRealTimers();
    }
  });

  it('times out if Mermaid never finishes rendering', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 600 });
    const block = document.createElement('div');
    block.dataset.mermaidStatus = 'rendering';
    root.append(block);

    const ready = waitForPreviewReady(root, { timeoutMs: 500 });
    const expectation = expect(ready).rejects.toMatchObject({
      code: 'MERMAID_TIMEOUT',
    });
    await vi.advanceTimersByTimeAsync(501);

    await expectation;
    vi.useRealTimers();
  });
});
