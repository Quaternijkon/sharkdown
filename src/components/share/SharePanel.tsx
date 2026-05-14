import {
  Clipboard,
  Download,
  FileCode2,
  FileJson,
  FileText,
  Link,
  ScanLine,
  Share2,
  Upload,
} from 'lucide-react';
import { useMemo, useRef, useState, type RefObject } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { copyPlainText, copyRichHtml } from '../../share/clipboardFormats';
import { createStandaloneHtmlBlob } from '../../share/htmlExport';
import {
  createProjectPackageBlob,
  parseProjectPackageFile,
  restoreProjectAssets,
} from '../../share/projectPackage';
import { scanMarkdownForShare } from '../../share/privacyScan';
import { createShareUrl, encodeSharePayload } from '../../share/urlShare';
import { useEditorStore } from '../../store/useEditorStore';
import { getThemeById } from '../../themes/presets';
import type { DocumentState } from '../../types';
import { createExportFileName, downloadBlob } from '../../utils/download';

interface SharePanelProps {
  previewRef: RefObject<HTMLDivElement | null>;
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function SharePanel({ previewRef, onNotice }: SharePanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const markdown = useEditorStore((state) => state.markdown);
  const state = useCurrentDocumentState();
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const theme = getThemeById(state.themeId);
  const encodedPayloadLength = useMemo(
    () =>
      encodeSharePayload({
        version: 1,
        title: extractTitle(markdown),
        markdown,
        themeId: state.themeId,
      }).length,
    [markdown, state.themeId],
  );
  const report = useMemo(
    () => scanMarkdownForShare(markdown, { encodedUrlLength: encodedPayloadLength }),
    [markdown, encodedPayloadLength],
  );

  async function runShareTask(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : '分享操作失败。', 'error');
    } finally {
      setBusy(false);
    }
  }

  function exportProjectPackage() {
    void runShareTask(async () => {
      const blob = await createProjectPackageBlob({
        title: extractTitle(markdown),
        markdown,
        state,
      });
      downloadBlob(blob, createExportFileName('sharkdown'));
      onNotice('.sharkdown 工程包已生成。', 'success');
    });
  }

  function exportStandaloneHtml() {
    void runShareTask(async () => {
      const target = requirePreview(previewRef.current);
      const blob = createStandaloneHtmlBlob({
        title: extractTitle(markdown),
        renderedHtml: target.innerHTML,
        themeClassName: theme.proseClassName ?? '',
        themeVars: theme.cssVars,
        markdown,
        includeSourceMarkdown: true,
      });
      downloadBlob(blob, createExportFileName('html'));
      onNotice('自包含 HTML 已生成。', 'success');
    });
  }

  function downloadMarkdown() {
    downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), createExportFileName('md'));
    onNotice('Markdown 文件已生成。', 'success');
  }

  function copyRichText() {
    void runShareTask(async () => {
      const target = requirePreview(previewRef.current);
      await copyRichHtml(target.innerHTML, target.textContent ?? markdown);
      onNotice('富文本 HTML 已复制。', 'success');
    });
  }

  function copyPlain() {
    void runShareTask(async () => {
      await copyPlainText(markdown);
      onNotice('纯文本已复制。', 'success');
    });
  }

  function copyShareLink() {
    void runShareTask(async () => {
      const url = createShareUrl(new URL(import.meta.env.BASE_URL, window.location.origin).toString(), {
        version: 1,
        title: extractTitle(markdown),
        markdown,
        themeId: state.themeId,
      });
      await navigator.clipboard.writeText(url);
      onNotice(report.canUseUrlShare ? '轻量分享链接已复制。' : '链接已复制，但建议优先使用文件交付。', 'success');
    });
  }

  function nativeShare() {
    void runShareTask(async () => {
      const url = createShareUrl(new URL(import.meta.env.BASE_URL, window.location.origin).toString(), {
        version: 1,
        title: extractTitle(markdown),
        markdown,
        themeId: state.themeId,
      });
      if (navigator.share) {
        await navigator.share({
          title: extractTitle(markdown),
          text: 'Sharkdown Markdown 分享',
          url,
        });
        onNotice('已调用系统分享。', 'success');
        return;
      }
      await navigator.clipboard.writeText(url);
      onNotice('当前浏览器不支持系统分享，已复制链接。', 'info');
    });
  }

  function importProjectPackage(file: File) {
    void runShareTask(async () => {
      const project = await parseProjectPackageFile(file);
      await restoreProjectAssets(project.assets);
      setMarkdown(project.markdown);
      updateSettings(project.state);
      onNotice(`已导入工程包：${project.manifest.title}`, 'success');
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Share2 size={17} />
          <span>Share Markdown</span>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
          {report.canUseUrlShare ? '可轻量链接' : '建议文件交付'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ToolbarButton
          icon={<FileJson size={16} />}
          label="导出 .sharkdown 工程包"
          text=".sharkdown"
          tone="primary"
          disabled={busy}
          onClick={exportProjectPackage}
        />
        <ToolbarButton
          icon={<Upload size={16} />}
          label="导入 .sharkdown 工程包"
          text="导入"
          disabled={busy}
          onClick={() => importInputRef.current?.click()}
        />
        <ToolbarButton
          icon={<FileCode2 size={16} />}
          label="导出自包含 HTML"
          text="HTML"
          disabled={busy}
          onClick={exportStandaloneHtml}
        />
        <ToolbarButton
          icon={<FileText size={16} />}
          label="下载 Markdown"
          text="MD"
          disabled={busy}
          onClick={downloadMarkdown}
        />
        <ToolbarButton
          icon={<Clipboard size={16} />}
          label="复制富文本 HTML"
          text="富文本"
          disabled={busy}
          onClick={copyRichText}
        />
        <ToolbarButton
          icon={<Download size={16} />}
          label="复制纯文本"
          text="纯文本"
          disabled={busy}
          onClick={copyPlain}
        />
        <ToolbarButton
          icon={<Link size={16} />}
          label="复制轻量分享链接"
          text="链接"
          disabled={busy}
          onClick={copyShareLink}
        />
        <ToolbarButton
          icon={<Share2 size={16} />}
          label="系统分享"
          text="系统"
          disabled={busy}
          onClick={nativeShare}
        />
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ScanLine size={14} />
          <span>分享前检查</span>
        </div>
        {report.issues.length === 0 ? (
          <p className="text-xs text-slate-500">未发现明显隐私或格式风险。</p>
        ) : (
          <ul className="space-y-1 text-xs leading-5 text-slate-600">
            {report.issues.slice(0, 4).map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
        )}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".sharkdown,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) {
            importProjectPackage(file);
          }
        }}
      />
    </section>
  );
}

function useCurrentDocumentState(): DocumentState {
  const markdown = useEditorStore((state) => state.markdown);
  const themeId = useEditorStore((state) => state.themeId);
  const width = useEditorStore((state) => state.width);
  const padding = useEditorStore((state) => state.padding);
  const radius = useEditorStore((state) => state.radius);
  const fontScale = useEditorStore((state) => state.fontScale);
  const background = useEditorStore((state) => state.background);
  const allowRawHtml = useEditorStore((state) => state.allowRawHtml);
  return {
    markdown,
    themeId,
    width,
    padding,
    radius,
    fontScale,
    background,
    allowRawHtml,
  };
}

function extractTitle(markdown: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || 'Sharkdown';
}

function requirePreview(element: HTMLDivElement | null): HTMLDivElement {
  if (!element) {
    throw new Error('预览节点不可用。');
  }
  return element;
}
