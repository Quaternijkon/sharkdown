import { useEffect, useRef, useState } from 'react';

import { ExportPanel } from '../components/controls/ExportPanel';
import { MarkdownAnalysisPanel } from '../components/analysis/MarkdownAnalysisPanel';
import { ConvertPanel } from '../components/convert/ConvertPanel';
import { DocumentLibraryPanel } from '../components/library/DocumentLibraryPanel';
import { SizePanel } from '../components/controls/SizePanel';
import { ThemePanel } from '../components/controls/ThemePanel';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { PreviewFrame } from '../components/preview/PreviewFrame';
import { SharePanel } from '../components/share/SharePanel';
import { TemplatePanel } from '../components/templates/TemplatePanel';
import { createBinaryArtifact, createTextArtifact, type ConvertArtifact, type ConvertTargetId } from '../convert/artifact';
import { createHtmlFragmentArtifact } from '../convert/htmlFragment';
import { ClipboardImageError, copyBlobToClipboard } from '../export/clipboard';
import { createBatchManifest, createBatchZipBlob } from '../export/batchPackage';
import { exportExtension, exportPreviewAsBlob } from '../export/exportImage';
import { exportPreviewAsPdf } from '../export/pdfExport';
import { exportSlicedPng } from '../export/sliceLongImage';
import { PreviewReadinessError } from '../export/waitForAssets';
import { copyPlainText, copyRichHtmlForTarget, markdownToPlainText } from '../share/clipboardFormats';
import { createStandaloneHtmlBlob } from '../share/htmlExport';
import { SharePayloadError, readSharePayloadFromHash } from '../share/urlShare';
import { useEditorStore } from '../store/useEditorStore';
import { getThemeById } from '../themes/presets';
import type { ImageExportSettings, PdfExportSettings } from '../types';
import { createExportFileName, downloadBlob } from '../utils/download';
import { APP_VERSION } from '../version';

type NoticeTone = 'info' | 'success' | 'error';

interface Notice {
  message: string;
  tone: NoticeTone;
}

export function App() {
  const previewRef = useRef<HTMLDivElement>(null);
  const markdown = useEditorStore((state) => state.markdown);
  const background = useEditorStore((state) => state.background);
  const themeId = useEditorStore((state) => state.themeId);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    message: 'Ready',
    tone: 'info',
  });

  function showNotice(message: string, tone: NoticeTone = 'info') {
    setNotice({ message, tone });
  }

  useEffect(() => {
    try {
      const payload = readSharePayloadFromHash(window.location.hash);
      if (!payload) {
        return;
      }
      setMarkdown(payload.markdown);
      updateSettings({ themeId: payload.themeId });
      window.setTimeout(() => showNotice(`已从分享链接导入：${payload.title}`, 'success'), 0);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (err) {
      window.setTimeout(
        () => showNotice(err instanceof SharePayloadError ? err.message : '分享链接导入失败。', 'error'),
        0,
      );
    }
  }, [setMarkdown, updateSettings]);

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

  function handleConvertArtifacts(targetId: ConvertTargetId, kinds: ConvertArtifact['kind'][]) {
    void runExport(async () => {
      const target = requirePreviewTarget(previewRef.current);
      for (const kind of kinds) {
        await exportConvertArtifact(target, targetId, kind);
      }
    });
  }

  async function exportConvertArtifact(
    target: HTMLElement,
    targetId: ConvertTargetId,
    kind: ConvertArtifact['kind'],
  ): Promise<void> {
    const title = extractTitle(markdown);

    if (kind === 'png' || kind === 'jpeg' || kind === 'webp' || kind === 'svg') {
      const blob = await exportPreviewAsBlob(target, {
        format: kind,
        pixelRatio: 2,
        backgroundColor: background,
        quality: 0.92,
      });
      downloadBlob(blob, createExportFileName(exportExtension(kind)));
      showNotice(`已生成 ${targetLabel(targetId)} ${kind.toUpperCase()}。`, 'success');
      return;
    }

    if (kind === 'pdf') {
      await exportPreviewAsPdf(target, {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 48,
        includeToc: true,
        includeHeaderFooter: true,
        includePageNumbers: true,
        title,
        backgroundColor: background,
      });
      showNotice('已打开打印窗口，请选择“另存为 PDF”。', 'success');
      return;
    }

    if (kind === 'html') {
      const theme = getThemeById(themeId);
      const blob = createStandaloneHtmlBlob({
        title,
        renderedHtml: target.innerHTML,
        themeClassName: theme.proseClassName ?? '',
        themeVars: theme.cssVars,
        markdown,
        includeSourceMarkdown: true,
      });
      downloadBlob(blob, createExportFileName('html'));
      showNotice(`已生成 ${targetLabel(targetId)} HTML。`, 'success');
      return;
    }

    if (kind === 'html-fragment' || kind === 'rich-text') {
      const artifact = createHtmlFragmentArtifact({
        html: target.innerHTML,
        title,
        targetId,
        includesLocalAssets: markdown.includes('local-image://'),
      });
      await copyRichHtmlForTarget(artifact.text ?? target.innerHTML, target.textContent ?? markdown, targetId);
      showNotice(`已复制 ${targetLabel(targetId)} HTML 片段。`, 'success');
      return;
    }

    if (kind === 'markdown') {
      const artifact = createTextArtifact({
        kind: 'markdown',
        fileName: 'sharkdown.md',
        mimeType: 'text/markdown;charset=utf-8',
        text: markdown,
        title,
        targetId,
        includesSourceMarkdown: true,
        includesLocalAssets: markdown.includes('local-image://'),
      });
      downloadBlob(new Blob([artifact.text ?? markdown], { type: artifact.mimeType }), artifact.fileName);
      showNotice(`已生成 ${targetLabel(targetId)} Markdown。`, 'success');
      return;
    }

    if (kind === 'plain-text') {
      await copyPlainText(markdown);
      showNotice(`已复制 ${targetLabel(targetId)}纯文本。`, 'success');
      return;
    }

    if (kind === 'zip') {
      const artifacts = await createBatchArtifacts(target, targetId, title);
      const createdAt = new Date().toISOString();
      const manifest = createBatchManifest({
        title,
        targetId,
        artifacts,
        createdAt,
        appVersion: APP_VERSION,
      });
      const blob = await createBatchZipBlob({ manifest, artifacts });
      downloadBlob(blob, createExportFileName('zip'));
      showNotice(`已生成 ${targetLabel(targetId)}批量包。`, 'success');
      return;
    }

    showNotice(`暂不支持 ${kind} 转换。`, 'info');
  }

  async function createBatchArtifacts(
    target: HTMLElement,
    targetId: ConvertTargetId,
    title: string,
  ): Promise<ConvertArtifact[]> {
    const createdAt = new Date();
    const htmlFragment = createHtmlFragmentArtifact({
      html: target.innerHTML,
      title,
      targetId,
      includesLocalAssets: markdown.includes('local-image://'),
    });
    const markdownArtifact = createTextArtifact({
      kind: 'markdown',
      fileName: 'source.md',
      mimeType: 'text/markdown;charset=utf-8',
      text: markdown,
      title,
      targetId,
      includesSourceMarkdown: true,
      includesLocalAssets: markdown.includes('local-image://'),
      now: createdAt,
    });
    const plainTextArtifact = createTextArtifact({
      kind: 'plain-text',
      fileName: 'plain-text.txt',
      mimeType: 'text/plain;charset=utf-8',
      text: markdownToPlainText(markdown),
      title,
      targetId,
      includesSourceMarkdown: false,
      includesLocalAssets: false,
      now: createdAt,
    });
    const pngBlob = await exportPreviewAsBlob(target, {
      format: 'png',
      pixelRatio: 2,
      backgroundColor: background,
    });
    const pngArtifact = createBinaryArtifact({
      kind: 'png',
      fileName: 'preview.png',
      mimeType: 'image/png',
      blob: pngBlob,
      title,
      targetId,
      includesLocalAssets: markdown.includes('local-image://'),
      now: createdAt,
    });

    return [markdownArtifact, plainTextArtifact, htmlFragment, pngArtifact];
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Sharkdown logo"
            className="h-10 w-10 rounded-md bg-white object-contain"
          />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Sharkdown</h1>
            <div className="text-xs text-slate-300">离线 Markdown 分享工作台</div>
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

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(320px,0.86fr)_minmax(420px,1.2fr)_340px]">
        <div className="flex min-h-0 flex-col gap-3">
          <DocumentLibraryPanel onNotice={showNotice} />
          <MarkdownEditor onNotice={showNotice} />
        </div>
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
          <ConvertPanel
            markdown={markdown}
            renderedHtml={previewRef.current?.innerHTML ?? ''}
            estimatedLocalAssetBytes={0}
            busy={busy}
            onExportArtifacts={handleConvertArtifacts}
          />
          <MarkdownAnalysisPanel markdown={markdown} />
          <SharePanel previewRef={previewRef} onNotice={showNotice} />
          <TemplatePanel onNotice={showNotice} />
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

function extractTitle(markdown: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || 'Sharkdown';
}

function targetLabel(targetId: ConvertTargetId): string {
  const labels: Partial<Record<ConvertTargetId, string>> = {
    wechat: '微信公众号',
    xiaohongshu: '小红书',
    douyin: '抖音',
    zhihu: '知乎',
    github: 'GitHub',
    notion: 'Notion',
    email: '邮件',
    slides: '轮播',
    print: '打印',
    generic: '通用',
  };
  return labels[targetId] ?? '转换';
}
