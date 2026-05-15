import {
  Archive,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  RotateCcw,
  Save,
  Search,
  Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import {
  archivedDocuments as listArchivedDocuments,
  hasUnsavedDocumentChanges,
  serializeLibraryBackup,
  type SharkdownLibraryDocument,
} from '../../library/documentLibrary';
import { useLibraryStore } from '../../library/useLibraryStore';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';
import type { DocumentState } from '../../types';
import { createExportFileName, downloadBlob } from '../../utils/download';
import { APP_VERSION } from '../../version';

interface DocumentLibraryPanelProps {
  onNotice: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export function DocumentLibraryPanel({ onNotice }: DocumentLibraryPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [titleInput, setTitleInput] = useState(() => initialSelectedDocument()?.title ?? '');
  const [tagInput, setTagInput] = useState(() => initialSelectedDocument()?.tags.join(', ') ?? '');
  const [showArchive, setShowArchive] = useState(false);
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
  const importLibraryBackup = useLibraryStore((state) => state.importLibraryBackup);
  const visibleDocuments = useLibraryStore((state) => state.visibleDocuments);

  const selectedDocument = useMemo(
    () => library.documents.find((document) => document.id === selectedDocumentId),
    [library.documents, selectedDocumentId],
  );
  const activeDocuments = visibleDocuments();
  const archivedDocuments = useMemo(() => listArchivedDocuments(library), [library]);
  const draftTags = parseTags(tagInput);
  const draftTitle = titleInput.trim() || extractTitle(markdown);
  const isDirty = hasUnsavedDocumentChanges(selectedDocument, {
    title: draftTitle,
    markdown,
    state: editorState,
    tags: draftTags,
  });
  const shouldWarnBeforeLeaving =
    Boolean(selectedDocument && isDirty) || (!selectedDocument && markdown.trim().length > 0 && markdown !== DEFAULT_DOCUMENT_STATE.markdown);

  function saveCurrentDocument() {
    const title = draftTitle;
    const tags = draftTags;
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
    setTitleInput(title);
    onNotice('已创建本地文档。', 'success');
  }

  function createBlankDocument() {
    if (!confirmUnsavedChanges()) {
      return;
    }
    const state = { ...DEFAULT_DOCUMENT_STATE, markdown: '' };
    const id = createDocument({
      title: 'Untitled',
      markdown: '',
      state,
      tags: [],
    });
    selectDocument(id);
    applyDocument({ markdown: '', state });
    setTitleInput('Untitled');
    setTagInput('');
    onNotice('已新建空白文档。');
  }

  function loadDocument(document: SharkdownLibraryDocument) {
    if (document.id !== selectedDocumentId && !confirmUnsavedChanges()) {
      return;
    }
    selectDocument(document.id);
    applyDocument(document);
    setTitleInput(document.title);
    setTagInput(document.tags.join(', '));
    onNotice(`已打开：${document.title}`);
  }

  function exportLibrary() {
    const backup = serializeLibraryBackup(library, { appVersion: APP_VERSION });
    downloadBlob(new Blob([backup], { type: 'application/json;charset=utf-8' }), createExportFileName('json', 'library'));
    onNotice('文档库备份已生成。', 'success');
  }

  function importLibrary(file: File) {
    void file
      .text()
      .then((raw) => {
        const result = importLibraryBackup(raw);
        onNotice(`已导入文档库：新增 ${result.imported}，更新 ${result.updated}，跳过 ${result.skipped}。`, 'success');
      })
      .catch((error: unknown) => {
        onNotice(error instanceof Error ? error.message : '文档库导入失败。', 'error');
      })
      .finally(() => {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      });
  }

  function archiveSelectedDocument() {
    if (!selectedDocumentId || !confirmUnsavedChanges()) {
      return;
    }
    archiveDocument(selectedDocumentId);
    setTitleInput('');
    setTagInput('');
    onNotice('文档已移入归档区。');
  }

  function duplicateSelectedDocument() {
    if (!selectedDocumentId || !confirmUnsavedChanges()) {
      return;
    }
    const copyId = selectedDocumentId ? duplicateDocument(selectedDocumentId) : undefined;
    if (!copyId) {
      return;
    }
    const copy = useLibraryStore.getState().library.documents.find((document) => document.id === copyId);
    if (copy) {
      loadDocument(copy);
    }
    onNotice('文档副本已创建。', 'success');
  }

  function restoreAndOpen(document: SharkdownLibraryDocument) {
    if (!confirmUnsavedChanges()) {
      return;
    }
    restoreDocument(document.id);
    loadDocument({ ...document, archivedAt: undefined });
  }

  function confirmUnsavedChanges(): boolean {
    if (!shouldWarnBeforeLeaving) {
      return true;
    }
    return window.confirm('当前文档有未保存改动。继续操作会丢弃这些改动，是否继续？');
  }

  function applyDocument(document: Pick<SharkdownLibraryDocument, 'markdown' | 'state'>) {
    setMarkdown(document.markdown);
    updateSettings(document.state);
  }

  return (
    <section className="flex max-h-[46vh] min-h-[320px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
          <FolderOpen size={17} />
          <span>文档库</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-normal text-slate-600">
            {selectedDocument ? (isDirty ? '未保存' : '已保存') : '临时草稿'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      <div className="space-y-2 border-b border-slate-200 p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="min-w-0">
            <span className="sr-only">当前文档标题</span>
            <input
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
              placeholder="当前文档标题"
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm font-medium outline-none focus:border-slate-500"
            />
          </label>
          <div className="flex items-center gap-1">
            <ToolbarButton icon={<Download size={16} />} label="导出文档库备份" onClick={exportLibrary} />
            <ToolbarButton
              icon={<Upload size={16} />}
              label="导入文档库备份"
              onClick={() => importInputRef.current?.click()}
            />
          </div>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              importLibrary(file);
            }
          }}
        />
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
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-slate-500"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeDocuments.length === 0 ? (
          <div className="px-3 py-4 text-xs leading-5 text-slate-500">暂无文档，保存当前内容后会出现在这里。</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeDocuments.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                selected={selectedDocumentId === document.id}
                onOpen={() => loadDocument(document)}
              />
            ))}
          </div>
        )}

        {showArchive ? (
          <div className="border-t border-slate-200 bg-slate-50">
            <div className="px-3 py-2 text-xs font-medium text-slate-600">归档区</div>
            {archivedDocuments.length === 0 ? (
              <div className="px-3 pb-3 text-xs text-slate-500">暂无归档文档。</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {archivedDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => restoreAndOpen(document)}
                    className="block w-full px-3 py-2 text-left hover:bg-slate-100"
                    aria-label={`恢复文档：${document.title}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-700">{document.title}</span>
                      <span className="shrink-0 text-[11px] text-slate-500">{formatDate(document.updatedAt)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">点击恢复并打开</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-2">
        <ToolbarButton
          icon={<Copy size={16} />}
          label="复制当前文档"
          disabled={!selectedDocumentId}
          onClick={duplicateSelectedDocument}
        />
        <ToolbarButton
          icon={<Archive size={16} />}
          label="归档当前文档"
          disabled={!selectedDocumentId}
          tone="danger"
          onClick={archiveSelectedDocument}
        />
        <ToolbarButton
          icon={<RotateCcw size={16} />}
          label={showArchive ? '隐藏归档区' : '显示归档区'}
          disabled={archivedDocuments.length === 0}
          onClick={() => setShowArchive((value) => !value)}
        />
        <span className="ml-auto truncate text-xs text-slate-500">
          {activeDocuments.length} 个文档
          {archivedDocuments.length ? ` / ${archivedDocuments.length} 个归档` : ''}
        </span>
      </div>
    </section>
  );
}

function DocumentRow({
  document,
  selected,
  onOpen,
}: {
  document: SharkdownLibraryDocument;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`打开文档：${document.title}`}
      className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${selected ? 'bg-teal-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-800">{document.title}</span>
        <span className="shrink-0 text-[11px] text-slate-500">{formatDate(document.updatedAt)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="min-w-0 truncate">
          {document.tags.length ? document.tags.join(' / ') : firstLine(document.markdown)}
        </span>
        <span className="shrink-0">{document.markdown.length} 字符</span>
      </div>
    </button>
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

function firstLine(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean) ?? '空白文档';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function initialSelectedDocument(): SharkdownLibraryDocument | undefined {
  const state = useLibraryStore.getState();
  return state.library.documents.find((document) => document.id === state.selectedDocumentId);
}
