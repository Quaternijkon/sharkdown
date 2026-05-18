import MDEditor from '@uiw/react-md-editor';
import { TextAreaCommandOrchestrator, type ICommand } from '@uiw/react-md-editor/commands';
import * as commandsCn from '@uiw/react-md-editor/commands-cn';
import {
  Bold,
  CheckSquare,
  Clipboard,
  Code2,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Strikethrough,
  Table2,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type MouseEvent, type ReactElement } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import { DEFAULT_MARKDOWN, useEditorStore } from '../../store/useEditorStore';
import { createLocalImageMarkdown, saveLocalImageAsset } from '../../utils/localImages';

interface MarkdownEditorProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

interface FloatingCommand {
  label: string;
  command: ICommand;
  icon: ReactElement;
}

interface SyntaxTemplate {
  label: string;
  markdown: string;
}

interface ContextMenuState {
  x: number;
  y: number;
}

const EDITOR_COMMANDS = commandsCn.getCommands();

const FLOATING_COMMANDS: FloatingCommand[] = [
  { label: '加粗', command: commandsCn.bold, icon: <Bold size={15} /> },
  { label: '斜体', command: commandsCn.italic, icon: <Italic size={15} /> },
  { label: '删除线', command: commandsCn.strikethrough, icon: <Strikethrough size={15} /> },
  { label: '二级标题', command: commandsCn.title2, icon: <Heading2 size={15} /> },
  { label: '引用', command: commandsCn.quote, icon: <Quote size={15} /> },
  { label: '链接', command: commandsCn.link, icon: <Link2 size={15} /> },
  { label: '代码块', command: commandsCn.codeBlock, icon: <Code2 size={15} /> },
  { label: '表格', command: commandsCn.table, icon: <Table2 size={15} /> },
  { label: '无序列表', command: commandsCn.unorderedListCommand, icon: <List size={15} /> },
  { label: '有序列表', command: commandsCn.orderedListCommand, icon: <ListOrdered size={15} /> },
  { label: '任务清单', command: commandsCn.checkedListCommand, icon: <CheckSquare size={15} /> },
];

const CONTEXT_FORMAT_COMMANDS = FLOATING_COMMANDS.slice(0, 8);

const SYNTAX_TEMPLATES: SyntaxTemplate[] = [
  {
    label: '任务清单模板',
    markdown: '- [ ] 待办事项\n- [ ] 待办事项\n',
  },
  {
    label: 'Mermaid 流程图',
    markdown: '```mermaid\nflowchart LR\n  A[开始] --> B[处理]\n  B --> C[完成]\n```\n',
  },
  {
    label: '公式块',
    markdown: '$$\nE = mc^2\n$$\n',
  },
  {
    label: '表格模板',
    markdown: '| 项目 | 说明 |\n|---|---|\n|  |  |\n',
  },
];

export function MarkdownEditor({ onNotice }: MarkdownEditorProps) {
  const markdown = useEditorStore((state) => state.markdown);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const clearMarkdown = useEditorStore((state) => state.clearMarkdown);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const contextMenuStyle = useMemo(
    () =>
      contextMenu
        ? {
            left: contextMenu.x,
            top: contextMenu.y,
          }
        : undefined,
    [contextMenu],
  );

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function closeContextMenu(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') {
        return;
      }
      setContextMenu(null);
    }

    window.addEventListener('pointerdown', closeContextMenu);
    window.addEventListener('keydown', closeContextMenu);
    return () => {
      window.removeEventListener('pointerdown', closeContextMenu);
      window.removeEventListener('keydown', closeContextMenu);
    };
  }, [contextMenu]);

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

  function handleContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }

  function executeEditorCommand(command: ICommand) {
    const textarea = getTextarea();
    if (!textarea) {
      return;
    }

    textarea.focus();
    const orchestrator = new TextAreaCommandOrchestrator(textarea);
    orchestrator.executeCommand(command);
    setMarkdown(textarea.value);
    window.requestAnimationFrame(() => textarea.focus());
  }

  function executeContextCommand(command: ICommand) {
    executeEditorCommand(command);
    setContextMenu(null);
  }

  function insertTemplate(template: SyntaxTemplate) {
    insertAtCursor(template.markdown);
    setContextMenu(null);
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
      <div
        ref={editorRootRef}
        className="sharkdown-editor-surface relative min-h-[420px] flex-1 overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        <MDEditor
          value={markdown}
          onChange={(value) => setMarkdown(value ?? '')}
          preview="edit"
          height="100%"
          commands={EDITOR_COMMANDS}
          extraCommands={[]}
          hideToolbar
          textareaProps={{
            spellCheck: false,
            'aria-label': 'Markdown 编辑区',
            onPaste: handlePaste,
            onContextMenu: handleContextMenu,
          }}
        />
      </div>

      <div
        role="toolbar"
        aria-label="Markdown 浮动工具栏"
        className="sharkdown-floating-markdown-toolbar"
      >
        {FLOATING_COMMANDS.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-label={item.label}
            title={item.label}
            onClick={() => executeEditorCommand(item.command)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {contextMenu ? (
        <div
          role="menu"
          aria-label="Markdown 右键菜单"
          className="sharkdown-editor-context-menu"
          style={contextMenuStyle}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="sharkdown-editor-context-menu__section">
            <span>格式</span>
            {CONTEXT_FORMAT_COMMANDS.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => executeContextCommand(item.command)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="sharkdown-editor-context-menu__section">
            <span>语法模板</span>
            {SYNTAX_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                role="menuitem"
                onClick={() => insertTemplate(template)}
              >
                <FileText size={15} />
                <span>{template.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
