import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { BarChart3, FolderTree, Palette, RefreshCw } from 'lucide-react';

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
import { WorkspaceSidebar } from '../components/workspace/WorkspaceSidebar';
import {
  clampWorkspaceColumns,
  COLLAPSED_SIDEBAR_WIDTH,
  DEFAULT_WORKSPACE_COLUMNS,
  type WorkspaceColumnWidths,
} from '../components/workspace/workspaceLayout';
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
  const [columnWidths, setColumnWidths] = useState<WorkspaceColumnWidths>(DEFAULT_WORKSPACE_COLUMNS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  function startColumnResize(
    divider: 'editor-preview' | 'preview-sidebar',
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidths = columnWidths;

    function handlePointerMove(moveEvent: PointerEvent) {
      const delta = moveEvent.clientX - startX;
      setColumnWidths(
        clampWorkspaceColumns(
          divider === 'editor-preview'
            ? {
                editor: startWidths.editor + delta,
                preview: startWidths.preview - delta,
                sidebar: startWidths.sidebar,
              }
            : {
                editor: startWidths.editor,
                preview: startWidths.preview + delta,
                sidebar: startWidths.sidebar - delta,
              },
        ),
      );
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  const workspaceStyle = {
    '--workspace-editor': `${columnWidths.editor}px`,
    '--workspace-preview': `${columnWidths.preview}px`,
    '--workspace-sidebar': `${sidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : columnWidths.sidebar}px`,
  } as CSSProperties;

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
            <div className="text-xs text-slate-300">share markdown！</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Quaternijkon/sharkdown"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 仓库"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            <GitHubMark />
          </a>
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
        </div>
      </header>

      <main className="sharkdown-workspace min-h-0 flex-1 p-3 xl:p-4" style={workspaceStyle}>
        <div className="flex min-h-0 flex-col">
          <MarkdownEditor onNotice={showNotice} />
        </div>
        <div
          role="separator"
          aria-label="调整编辑器和预览宽度"
          aria-orientation="vertical"
          className="sharkdown-column-resizer"
          onPointerDown={(event) => startColumnResize('editor-preview', event)}
        />
        <PreviewFrame ref={previewRef} />
        <div
          role="separator"
          aria-label="调整预览和右侧栏宽度"
          aria-orientation="vertical"
          className="sharkdown-column-resizer"
          onPointerDown={(event) => startColumnResize('preview-sidebar', event)}
        />
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          panels={[
            {
              id: 'convert',
              label: '转换导出',
              icon: <RefreshCw size={19} />,
              content: (
                <>
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
                  <SharePanel previewRef={previewRef} onNotice={showNotice} />
                </>
              ),
            },
            {
              id: 'style',
              label: '外观样式',
              icon: <Palette size={19} />,
              content: (
                <>
                  <ThemePanel />
                  <SizePanel />
                  <TemplatePanel onNotice={showNotice} />
                </>
              ),
            },
            {
              id: 'analysis',
              label: '分析评估',
              icon: <BarChart3 size={19} />,
              content: <MarkdownAnalysisPanel markdown={markdown} />,
            },
            {
              id: 'library',
              label: '文件系统',
              icon: <FolderTree size={19} />,
              content: <DocumentLibraryPanel onNotice={showNotice} />,
            },
          ]}
        />
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

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.78.4.08.55-.18.55-.4v-1.53c-2.23.5-2.7-.98-2.7-.98-.36-.95-.89-1.2-.89-1.2-.73-.51.06-.5.06-.5.81.06 1.24.85 1.24.85.72 1.27 1.9.9 2.36.69.07-.53.28-.9.51-1.1-1.78-.21-3.64-.91-3.64-4.05 0-.89.31-1.62.83-2.2-.08-.21-.36-1.04.08-2.16 0 0 .68-.22 2.2.84A7.45 7.45 0 0 1 8 3.97c.68 0 1.36.09 2 .27 1.52-1.06 2.2-.84 2.2-.84.44 1.12.16 1.95.08 2.16.52.58.83 1.31.83 2.2 0 3.15-1.87 3.84-3.65 4.05.29.25.54.76.54 1.55v2.26c0 .22.14.48.55.4A8.12 8.12 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z" />
    </svg>
  );
}
