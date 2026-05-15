import MDEditor from '@uiw/react-md-editor';
import {
  Bold,
  Clipboard,
  Code2,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  RotateCcw,
  Strikethrough,
  Table2,
  Trash2,
} from 'lucide-react';
import { useRef, useState, type ClipboardEvent, type MouseEvent, type ReactNode } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { applyMarkdownFormat, type MarkdownFormatCommand } from '../../markdown/editorCommands';
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
  const [quickMenu, setQuickMenu] = useState<{
    x: number;
    y: number;
    start: number;
    end: number;
  } | null>(null);

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

  function formatSelection(command: MarkdownFormatCommand) {
    const textarea = getTextarea();
    const start = quickMenu?.start ?? textarea?.selectionStart ?? markdown.length;
    const end = quickMenu?.end ?? textarea?.selectionEnd ?? markdown.length;
    const result = applyMarkdownFormat(markdown, start, end, command);
    setMarkdown(result.markdown);
    setQuickMenu(null);
    window.requestAnimationFrame(() => {
      const nextTextarea = getTextarea();
      if (!nextTextarea) {
        return;
      }
      nextTextarea.focus();
      nextTextarea.selectionStart = result.selectionStart;
      nextTextarea.selectionEnd = result.selectionEnd;
    });
  }

  function handleContextMenu(event: MouseEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    if (textarea.selectionStart === textarea.selectionEnd) {
      setQuickMenu(null);
      return;
    }
    event.preventDefault();
    setQuickMenu({
      x: event.clientX,
      y: event.clientY,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
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
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2">
        {formatButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            title={button.label}
            aria-label={button.label}
            onClick={() => formatSelection(button.command)}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:border-slate-400"
          >
            {button.icon}
            {button.text ? <span className="ml-1">{button.text}</span> : null}
          </button>
        ))}
      </div>
      <div ref={editorRootRef} className="sharkdown-editor-surface relative min-h-[420px] flex-1 overflow-hidden">
        <MDEditor
          value={markdown}
          onChange={(value) => setMarkdown(value ?? '')}
          preview="edit"
          height="100%"
          textareaProps={{
            spellCheck: false,
            'aria-label': 'Markdown 编辑区',
            onPaste: handlePaste,
            onContextMenu: handleContextMenu,
          }}
        />
        {quickMenu ? (
          <div
            className="fixed z-50 flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-xl"
            style={{ left: quickMenu.x, top: quickMenu.y }}
            onMouseDown={(event) => event.preventDefault()}
          >
            {contextButtons.map((button) => (
              <button
                key={button.command}
                type="button"
                title={button.label}
                aria-label={button.label}
                onClick={() => formatSelection(button.command)}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-slate-700 hover:bg-slate-100"
              >
                {button.icon}
              </button>
            ))}
          </div>
        ) : null}
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

const formatButtons: Array<{
  command: MarkdownFormatCommand;
  label: string;
  icon: ReactNode;
  text?: string;
}> = [
  { command: 'bold', label: '加粗', icon: <Bold size={15} /> },
  { command: 'italic', label: '斜体', icon: <Italic size={15} /> },
  { command: 'strikethrough', label: '删除线', icon: <Strikethrough size={15} /> },
  { command: 'inline-code', label: '行内代码', icon: <Code2 size={15} /> },
  { command: 'h2', label: '二级标题', icon: <Heading2 size={15} /> },
  { command: 'quote', label: '引用', icon: <Quote size={15} /> },
  { command: 'unordered-list', label: '无序列表', icon: <List size={15} /> },
  { command: 'ordered-list', label: '有序列表', icon: <ListOrdered size={15} /> },
  { command: 'task-list', label: '任务清单', icon: <ListChecks size={15} /> },
  { command: 'link', label: '链接', icon: <Link2 size={15} /> },
  { command: 'table', label: '表格', icon: <Table2 size={15} /> },
];

const contextButtons = formatButtons.filter((button) =>
  ['bold', 'italic', 'inline-code', 'link', 'quote', 'task-list'].includes(button.command),
);
