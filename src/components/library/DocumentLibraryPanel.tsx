import { Archive, Copy, FilePlus2, FolderOpen, RotateCcw, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import type { DocumentState } from '../../types';
import type { SharkdownLibraryDocument } from '../../library/documentLibrary';
import { useLibraryStore } from '../../library/useLibraryStore';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

interface DocumentLibraryPanelProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function DocumentLibraryPanel({ onNotice }: DocumentLibraryPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const markdown = useEditorStore((state) => state.markdown);
  const editorState = useCurrentDocumentState();
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const library = useLibraryStore((state) => state.library);
  const selectedDocumentId = useLibraryStore((state) => state.selectedDocumentId);
  const searchQuery = useLibraryStore((state) => state.searchQuery);
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const createDocument = useLibraryStore((state) => state.createDocument);
  const saveDocument = useLibraryStore((state) => state.saveDocument);
  const selectDocument = useLibraryStore((state) => state.selectDocument);
  const archiveDocument = useLibraryStore((state) => state.archiveDocument);
  const restoreDocument = useLibraryStore((state) => state.restoreDocument);
  const duplicateDocument = useLibraryStore((state) => state.duplicateDocument);
  const visibleDocuments = useLibraryStore((state) => state.visibleDocuments);

  const archivedDocuments = useMemo(
    () => library.documents.filter((document) => document.archivedAt),
    [library.documents],
  );

  function saveCurrentDocument() {
    const title = extractTitle(markdown);
    const tags = parseTags(tagInput);
    if (selectedDocumentId) {
      saveDocument(selectedDocumentId, {
        title,
        markdown,
        state: editorState,
        tags,
      });
      onNotice('当前文档已保存到本地文档库。', 'success');
      return;
    }
    const id = createDocument({
      title,
      markdown,
      state: editorState,
      tags,
    });
    selectDocument(id);
    onNotice('已创建本地文档。', 'success');
  }

  function createBlankDocument() {
    const state = { ...DEFAULT_DOCUMENT_STATE, markdown: '' };
    const id = createDocument({
      title: 'Untitled',
      markdown: '',
      state,
      tags: [],
    });
    selectDocument(id);
    applyDocument({ markdown: '', state });
    setTagInput('');
    onNotice('已新建空白文档。');
  }

  function loadDocument(document: SharkdownLibraryDocument) {
    selectDocument(document.id);
    applyDocument(document);
    setTagInput(document.tags.join(', '));
    onNotice(`已打开：${document.title}`);
  }

  function applyDocument(document: Pick<SharkdownLibraryDocument, 'markdown' | 'state'>) {
    setMarkdown(document.markdown);
    updateSettings(document.state);
  }

  function selectedDocument() {
    return library.documents.find((document) => document.id === selectedDocumentId);
  }

  return (
    <section className="flex max-h-[36vh] min-h-[220px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FolderOpen size={17} />
          <span>文档库</span>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton icon={<FilePlus2 size={16} />} label="新建文档" onClick={createBlankDocument} />
          <ToolbarButton
            icon={<Save size={16} />}
            label="保存当前文档"
            text="保存"
            tone="primary"
            onClick={saveCurrentDocument}
          />
        </div>
      </div>
      <div className="border-b border-slate-200 p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2 top-2.5 text-slate-400" size={15} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索标题、正文、标签"
            className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-2 text-sm outline-none focus:border-slate-500"
          />
        </label>
        <input
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          placeholder="标签，用逗号分隔"
          className="mt-2 h-8 w-full rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-slate-500"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {visibleDocuments().length === 0 ? (
          <div className="px-3 py-4 text-xs leading-5 text-slate-500">暂无文档，保存当前内容后会出现在这里。</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleDocuments().map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => loadDocument(document)}
                className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${
                  selectedDocumentId === document.id ? 'bg-teal-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">{document.title}</span>
                  <span className="shrink-0 text-[11px] text-slate-500">{formatDate(document.updatedAt)}</span>
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {document.tags.length ? document.tags.join(' / ') : `${document.markdown.length} 字符`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-2">
        <ToolbarButton
          icon={<Copy size={16} />}
          label="复制当前文档"
          disabled={!selectedDocumentId}
          onClick={() => {
            const copyId = selectedDocumentId ? duplicateDocument(selectedDocumentId) : undefined;
            if (copyId) {
              onNotice('文档副本已创建。', 'success');
            }
          }}
        />
        <ToolbarButton
          icon={<Archive size={16} />}
          label="归档当前文档"
          disabled={!selectedDocumentId}
          tone="danger"
          onClick={() => {
            if (selectedDocumentId) {
              archiveDocument(selectedDocumentId);
              onNotice('文档已移入回收区。');
            }
          }}
        />
        <ToolbarButton
          icon={<RotateCcw size={16} />}
          label="恢复最近归档"
          disabled={archivedDocuments.length === 0}
          onClick={() => {
            const document = archivedDocuments.at(-1);
            if (document) {
              restoreDocument(document.id);
              loadDocument({ ...document, archivedAt: undefined });
            }
          }}
        />
        <span className="ml-auto truncate text-xs text-slate-500">
          {selectedDocument()?.title ?? `${library.documents.length} 个文档`}
        </span>
      </div>
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
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || 'Untitled';
}

function parseTags(input: string): string[] {
  return input
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}
