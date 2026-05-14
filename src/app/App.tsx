import { useRef, useState } from 'react';

import { ExportPanel } from '../components/controls/ExportPanel';
import { SizePanel } from '../components/controls/SizePanel';
import { ThemePanel } from '../components/controls/ThemePanel';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { PreviewFrame } from '../components/preview/PreviewFrame';
import { ClipboardImageError, copyBlobToClipboard } from '../export/clipboard';
import { exportExtension, exportPreviewAsBlob } from '../export/exportImage';
import { exportPreviewAsPdf } from '../export/pdfExport';
import { exportSlicedPng } from '../export/sliceLongImage';
import { PreviewReadinessError } from '../export/waitForAssets';
import { useEditorStore } from '../store/useEditorStore';
import type { ImageExportSettings, PdfExportSettings } from '../types';
import { createExportFileName, downloadBlob } from '../utils/download';

type NoticeTone = 'info' | 'success' | 'error';

interface Notice {
  message: string;
  tone: NoticeTone;
}

export function App() {
  const previewRef = useRef<HTMLDivElement>(null);
  const background = useEditorStore((state) => state.background);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    message: 'Ready',
    tone: 'info',
  });

  function showNotice(message: string, tone: NoticeTone = 'info') {
    setNotice({ message, tone });
  }

  async function runExport(task: () => Promise<void>) {
    if (!previewRef.current) {
      showNotice('预览节点不可用。', 'error');
      return;
    }

    setBusy(true);
    showNotice('导出中...');
    try {
      await task();
    } catch (err) {
      showNotice(toUserMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  function handleImageDownload(settings: ImageExportSettings) {
    void runExport(async () => {
      const target = requirePreviewTarget(previewRef.current);
      const blob = await exportPreviewAsBlob(target, {
        format: settings.format,
        pixelRatio: settings.pixelRatio,
        backgroundColor: background,
        quality: settings.quality,
      });
      const extension = exportExtension(settings.format);
      downloadBlob(blob, createExportFileName(extension));
      showNotice(`${extension.toUpperCase()} 已生成。`, 'success');
    });
  }

  function handleCopyImage(settings: ImageExportSettings) {
    void runExport(async () => {
      const target = requirePreviewTarget(previewRef.current);
      const blob = await exportPreviewAsBlob(target, {
        format: 'png',
        pixelRatio: settings.pixelRatio,
        backgroundColor: background,
      });

      try {
        await copyBlobToClipboard(blob);
        showNotice('图片已复制。', 'success');
      } catch (err) {
        if (err instanceof ClipboardImageError) {
          downloadBlob(blob, createExportFileName('png'));
          showNotice(err.message, 'info');
          return;
        }
        throw err;
      }
    });
  }

  function handleSliceExport(settings: ImageExportSettings) {
    void runExport(async () => {
      const target = requirePreviewTarget(previewRef.current);
      const slices = await exportSlicedPng(target, {
        pixelRatio: settings.pixelRatio,
        backgroundColor: background,
        sliceHeight: settings.sliceHeight,
      });
      slices.forEach((blob, index) => {
        downloadBlob(blob, createExportFileName('png', `part-${String(index + 1).padStart(2, '0')}`));
      });
      showNotice(`已生成 ${slices.length} 张切片。`, 'success');
    });
  }

  function handlePdfDownload(settings: PdfExportSettings) {
    void runExport(async () => {
      const target = requirePreviewTarget(previewRef.current);
      await exportPreviewAsPdf(target, {
        ...settings,
        backgroundColor: background,
      });
      showNotice('已打开打印窗口，请选择“另存为 PDF”。', 'success');
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-teal-500 font-bold text-slate-950">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Sharkdown</h1>
            <div className="text-xs text-slate-300">Markdown 转图片</div>
          </div>
        </div>
        <div
          className={`max-w-full rounded-md border px-3 py-1 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-500 bg-rose-950 text-rose-100'
              : notice.tone === 'success'
                ? 'border-emerald-500 bg-emerald-950 text-emerald-100'
                : 'border-slate-700 bg-slate-900 text-slate-200'
          }`}
        >
          {busy ? 'Working...' : notice.message}
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(320px,0.86fr)_minmax(420px,1.2fr)_320px]">
        <MarkdownEditor onNotice={showNotice} />
        <PreviewFrame ref={previewRef} />
        <aside className="flex min-h-0 flex-col gap-3 overflow-auto">
          <ThemePanel />
          <SizePanel />
          <ExportPanel
            busy={busy}
            backgroundColor={background}
            onImageDownload={handleImageDownload}
            onCopyImage={handleCopyImage}
            onSliceExport={handleSliceExport}
            onPdfDownload={handlePdfDownload}
          />
        </aside>
      </main>
    </div>
  );
}

function requirePreviewTarget(element: HTMLDivElement | null): HTMLElement {
  if (!element) {
    throw new Error('预览节点不可用。');
  }
  return element;
}

function toUserMessage(err: unknown): string {
  if (err instanceof PreviewReadinessError) {
    return err.message;
  }
  if (err instanceof Error) {
    if (/tainted|canvas|cors/i.test(err.message)) {
      return '导出失败：远程图片可能缺少 CORS 许可。请下载后以本地图片插入。';
    }
    return err.message;
  }
  return '导出失败，请降低像素倍率或减少内容后重试。';
}
