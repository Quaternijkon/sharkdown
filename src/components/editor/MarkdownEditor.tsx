import { Clipboard, FileText, ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { useRef } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { DEFAULT_MARKDOWN, useEditorStore } from '../../store/useEditorStore';
import { createImageMarkdown, fileToDataUrl } from '../../utils/imageInline';

interface MarkdownEditorProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function MarkdownEditor({ onNotice }: MarkdownEditorProps) {
  const markdown = useEditorStore((state) => state.markdown);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const clearMarkdown = useEditorStore((state) => state.clearMarkdown);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      onNotice('Markdown 已复制。', 'success');
    } catch {
      onNotice('当前浏览器无法写入剪贴板。', 'error');
    }
  }

  async function handleImageFile(file: File) {
    try {
      const dataUrl = await fileToDataUrl(file);
      insertAtCursor(createImageMarkdown(file.name, dataUrl));
      onNotice('本地图片已内联到 Markdown。', 'success');
    } catch (err) {
      onNotice(err instanceof Error ? err.message : '本地图片读取失败。', 'error');
    }
  }

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMarkdown(`${markdown}\n\n${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextMarkdown = `${markdown.slice(0, start)}${text}${markdown.slice(end)}`;
    setMarkdown(nextMarkdown);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + text.length;
      textarea.selectionEnd = start + text.length;
    });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText size={17} />
          <span>Markdown</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            icon={<RotateCcw size={16} />}
            label="恢复示例"
            text="示例"
            onClick={() => {
              setMarkdown(DEFAULT_MARKDOWN);
              onNotice('示例内容已恢复。');
            }}
          />
          <ToolbarButton
            icon={<ImagePlus size={16} />}
            label="插入本地图片"
            onClick={() => fileInputRef.current?.click()}
          />
          <ToolbarButton
            icon={<Clipboard size={16} />}
            label="复制 Markdown"
            onClick={() => void copyMarkdown()}
          />
          <ToolbarButton
            icon={<Trash2 size={16} />}
            label="清空"
            tone="danger"
            onClick={() => {
              clearMarkdown();
              onNotice('内容已清空。');
            }}
          />
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={markdown}
        spellCheck={false}
        onChange={(event) => setMarkdown(event.target.value)}
        className="min-h-[420px] flex-1 resize-none border-0 bg-slate-950 p-4 font-mono text-[14px] leading-6 text-slate-100 outline-none"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) {
            void handleImageFile(file);
          }
        }}
      />
    </section>
  );
}
