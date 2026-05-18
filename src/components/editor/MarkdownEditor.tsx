import MDEditor from '@uiw/react-md-editor';
import * as commandsCn from '@uiw/react-md-editor/commands-cn';
import { Clipboard, FileText, ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { useRef, type ClipboardEvent } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { DEFAULT_MARKDOWN, useEditorStore } from '../../store/useEditorStore';
import { createLocalImageMarkdown, saveLocalImageAsset } from '../../utils/localImages';

interface MarkdownEditorProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function MarkdownEditor({ onNotice }: MarkdownEditorProps) {
  const markdown = useEditorStore((state) => state.markdown);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const clearMarkdown = useEditorStore((state) => state.clearMarkdown);
  const editorRootRef = useRef<HTMLDivElement>(null);
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
      const reference = await saveLocalImageAsset(file);
      insertAtCursor(createLocalImageMarkdown(reference));
      onNotice('本地图片已作为短引用插入。', 'success');
    } catch (err) {
      onNotice(err instanceof Error ? err.message : '本地图片读取失败。', 'error');
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    void Promise.all(imageFiles.map((file) => handleImageFile(file)));
  }

  function insertAtCursor(text: string) {
    const textarea = getTextarea();
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

  function getTextarea(): HTMLTextAreaElement | null {
    return editorRootRef.current?.querySelector('textarea') ?? null;
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
      <div ref={editorRootRef} className="sharkdown-editor-surface relative min-h-[420px] flex-1 overflow-hidden">
        <MDEditor
          value={markdown}
          onChange={(value) => setMarkdown(value ?? '')}
          preview="edit"
          height="100%"
          commands={commandsCn.getCommands()}
          extraCommands={[]}
          toolbarBottom
          textareaProps={{
            spellCheck: false,
            'aria-label': 'Markdown 编辑区',
            onPaste: handlePaste,
          }}
        />
      </div>
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
