import {
  Archive,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FilePlus2,
  Folder,
  FolderPlus,
  FolderOpen,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { ToolbarButton } from '../common/Toolbar';
import {
  archivedDocuments as listArchivedDocuments,
  buildLibraryTree,
  hasUnsavedDocumentChanges,
  parseLibraryBackup,
  serializeLibraryBackup,
  type SharkdownLibraryFolderNode,
  type SharkdownLibraryDocument,
} from '../../library/documentLibrary';
import { useLibraryStore } from '../../library/useLibraryStore';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';
import { collectLocalImageAssets, restoreProjectAssets, type SharkdownProjectAsset } from '../../share/projectPackage';
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
  const [folderInput, setFolderInput] = useState('');
  const [folderRenameDraft, setFolderRenameDraft] = useState<{ folderId?: string; name: string }>({ name: '' });
  const [showArchive, setShowArchive] = useState(false);
  const markdown = useEditorStore((state) => state.markdown);
  const editorState = useCurrentDocumentState();
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const updateSettings = useEditorStore((state) => state.updateSettings);
  const library = useLibraryStore((state) => state.library);
  const selectedDocumentId = useLibraryStore((state) => state.selectedDocumentId);
  const selectedFolderId = useLibraryStore((state) => state.selectedFolderId);
  const searchQuery = useLibraryStore((state) => state.searchQuery);
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const selectFolder = useLibraryStore((state) => state.selectFolder);
  const createFolder = useLibraryStore((state) => state.createFolder);
  const renameFolder = useLibraryStore((state) => state.renameFolder);
  const deleteFolder = useLibraryStore((state) => state.deleteFolder);
  const moveDocumentToFolder = useLibraryStore((state) => state.moveDocumentToFolder);
  const toggleFolderCollapsed = useLibraryStore((state) => state.toggleFolderCollapsed);
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
  const selectedFolder = useMemo(
    () => library.folders.find((folder) => folder.id === selectedFolderId),
    [library.folders, selectedFolderId],
  );
  const libraryTree = useMemo(() => buildLibraryTree(library, searchQuery), [library, searchQuery]);
  const archivedDocuments = useMemo(() => listArchivedDocuments(library), [library]);
  const folderOptions = useMemo(() => flattenFolders(libraryTree.folders), [libraryTree.folders]);
  const folderRenameValue =
    selectedFolder && folderRenameDraft.folderId === selectedFolder.id ? folderRenameDraft.name : (selectedFolder?.name ?? '');
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
        folderId: selectedDocument?.folderId ?? selectedFolderId,
      });
      onNotice('当前文档已保存到本地文档库。', 'success');
      return;
    }
    const id = createDocument({
      title,
      markdown,
      state: editorState,
      tags,
      folderId: selectedFolderId,
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
      folderId: selectedFolderId,
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
    void runLibraryTask(async () => {
      const assets = await collectLibraryAssets(library.documents);
      const backup = serializeLibraryBackup(library, { appVersion: APP_VERSION, assets });
      downloadBlob(
        new Blob([backup], { type: 'application/json;charset=utf-8' }),
        createExportFileName('json', 'library'),
      );
      onNotice(assets.length ? `文档库备份已生成，包含 ${assets.length} 个本地图片资产。` : '文档库备份已生成。', 'success');
    });
  }

  function importLibrary(file: File) {
    void runLibraryTask(async () => {
      const raw = await file.text();
      const backup = parseLibraryBackup(raw);
      if (backup.assets?.length) {
        await restoreProjectAssets(backup.assets);
      }
      const result = importLibraryBackup(raw);
      onNotice(
        `已导入文档库：新增 ${result.imported}，更新 ${result.updated}，跳过 ${result.skipped}${
          backup.assets?.length ? `，恢复 ${backup.assets.length} 个本地图片` : ''
        }。`,
        'success',
      );
    }).finally(() => {
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

  function createFolderFromInput() {
    const name = folderInput.trim();
    if (!name) {
      onNotice('请输入文件夹名称。', 'error');
      return;
    }
    const id = createFolder(name, selectedFolderId);
    selectFolder(id);
    setFolderInput('');
    onNotice(`已创建文件夹：${name}`, 'success');
  }

  function renameSelectedFolder() {
    if (!selectedFolder) {
      return;
    }
    const name = folderRenameValue.trim();
    if (!name) {
      onNotice('请输入新的文件夹名称。', 'error');
      return;
    }
    renameFolder(selectedFolder.id, name);
    onNotice(`文件夹已重命名为：${name}`, 'success');
  }

  function deleteSelectedFolder() {
    if (!selectedFolder) {
      return;
    }
    const confirmed = window.confirm('移除该虚拟文件夹？内部文档会保留并移动到根目录。');
    if (!confirmed) {
      return;
    }
    deleteFolder(selectedFolder.id);
    selectFolder(undefined);
    onNotice('文件夹已移除，内部文档已保留到根目录。', 'success');
  }

  function moveSelectedDocumentToFolder(folderId: string) {
    if (!selectedDocumentId) {
      return;
    }
    moveDocumentToFolder(selectedDocumentId, folderId || undefined);
    onNotice(folderId ? '文档已移动到所选文件夹。' : '文档已移动到根目录。', 'success');
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

  async function runLibraryTask(task: () => Promise<void>) {
    try {
      await task();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '文档库操作失败。', 'error');
    }
  }

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white xl:h-[calc(100vh-130px)]">
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            value={folderInput}
            onChange={(event) => setFolderInput(event.target.value)}
            placeholder="新建虚拟文件夹"
            className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-slate-500"
          />
          <ToolbarButton icon={<FolderPlus size={16} />} label="新建虚拟文件夹" onClick={createFolderFromInput} />
        </div>
        {selectedFolder ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
              <Folder size={14} />
              <span className="min-w-0 truncate">当前文件夹：{selectedFolder.name}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
              <label className="min-w-0">
                <span className="sr-only">文件夹新名称</span>
                <input
                  value={folderRenameValue}
                  onChange={(event) => setFolderRenameDraft({ folderId: selectedFolder.id, name: event.target.value })}
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-500"
                />
              </label>
              <ToolbarButton
                icon={<Pencil size={15} />}
                label="重命名选中文件夹"
                onClick={renameSelectedFolder}
              />
              <ToolbarButton
                icon={<Trash2 size={15} />}
                label="移除选中文件夹"
                tone="danger"
                onClick={deleteSelectedFolder}
              />
            </div>
          </div>
        ) : null}
        {selectedDocumentId ? (
          <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-xs text-slate-600">
            <span>位置</span>
            <select
              value={selectedDocument?.folderId ?? ''}
              onChange={(event) => moveSelectedDocumentToFolder(event.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-500"
            >
              <option value="">根目录</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.depth > 0 ? `${'  '.repeat(folder.depth)}└ ` : ''}
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {libraryTree.rootDocuments.length === 0 && libraryTree.folders.length === 0 ? (
          <div className="px-3 py-4 text-xs leading-5 text-slate-500">暂无文档，保存当前内容后会出现在这里。</div>
        ) : (
          <div className="divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => selectFolder(undefined)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium ${
                selectedFolderId ? 'text-slate-600 hover:bg-slate-50' : 'bg-teal-50 text-teal-900'
              }`}
            >
              <FolderOpen size={15} />
              <span>根目录</span>
              <span className="ml-auto text-[11px] text-slate-500">{libraryTree.rootDocuments.length}</span>
            </button>
            {libraryTree.rootDocuments.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                selected={selectedDocumentId === document.id}
                onOpen={() => loadDocument(document)}
              />
            ))}
            {libraryTree.folders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                depth={0}
                selectedFolderId={selectedFolderId}
                selectedDocumentId={selectedDocumentId}
                onSelectFolder={selectFolder}
                onToggleFolder={toggleFolderCollapsed}
                onOpenDocument={loadDocument}
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
          {visibleDocuments().length} 个文档
          {archivedDocuments.length ? ` / ${archivedDocuments.length} 个归档` : ''}
        </span>
      </div>
    </section>
  );
}

function FolderNode({
  folder,
  depth,
  selectedFolderId,
  selectedDocumentId,
  onSelectFolder,
  onToggleFolder,
  onOpenDocument,
}: {
  folder: SharkdownLibraryFolderNode;
  depth: number;
  selectedFolderId: string | undefined;
  selectedDocumentId: string | undefined;
  onSelectFolder: (folderId: string | undefined) => void;
  onToggleFolder: (folderId: string) => void;
  onOpenDocument: (document: SharkdownLibraryDocument) => void;
}) {
  const itemCount = folder.documents.length + folder.children.length;
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-2 text-xs ${
          selectedFolderId === folder.id ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-200"
          aria-label={folder.collapsed ? `展开文件夹：${folder.name}` : `折叠文件夹：${folder.name}`}
          onClick={() => onToggleFolder(folder.id)}
        >
          {folder.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={() => onSelectFolder(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label={`选择文件夹：${folder.name}`}
        >
          <Folder size={15} />
          <span className="truncate font-medium">{folder.name}</span>
        </button>
        <span className="text-[11px] text-slate-500">{itemCount}</span>
      </div>
      {!folder.collapsed
        ? folder.documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              depth={depth + 1}
              selected={selectedDocumentId === document.id}
              onOpen={() => onOpenDocument(document)}
            />
          ))
        : null}
      {!folder.collapsed
        ? folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              selectedDocumentId={selectedDocumentId}
              onSelectFolder={onSelectFolder}
              onToggleFolder={onToggleFolder}
              onOpenDocument={onOpenDocument}
            />
          ))
        : null}
    </div>
  );
}

function DocumentRow({
  document,
  depth = 0,
  selected,
  onOpen,
}: {
  document: SharkdownLibraryDocument;
  depth?: number;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`打开文档：${document.title}`}
      className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${selected ? 'bg-teal-50' : ''}`}
      style={{ paddingLeft: `${12 + depth * 14}px` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 truncate text-sm font-medium text-slate-800">
          <FileText size={14} />
          <span className="truncate">{document.title}</span>
        </span>
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

function flattenFolders(
  folders: SharkdownLibraryFolderNode[],
  depth = 0,
): Array<{ id: string; name: string; depth: number }> {
  return folders.flatMap((folder) => [
    { id: folder.id, name: folder.name, depth },
    ...flattenFolders(folder.children, depth + 1),
  ]);
}

function useCurrentDocumentState(): DocumentState {
  const markdown = useEditorStore((state) => state.markdown);
  const layoutMode = useEditorStore((state) => state.layoutMode);
  const themeId = useEditorStore((state) => state.themeId);
  const width = useEditorStore((state) => state.width);
  const padding = useEditorStore((state) => state.padding);
  const radius = useEditorStore((state) => state.radius);
  const fontScale = useEditorStore((state) => state.fontScale);
  const background = useEditorStore((state) => state.background);
  const allowRawHtml = useEditorStore((state) => state.allowRawHtml);
  return {
    markdown,
    layoutMode,
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

async function collectLibraryAssets(documents: SharkdownLibraryDocument[]): Promise<SharkdownProjectAsset[]> {
  const assetsById = new Map<string, SharkdownProjectAsset>();
  for (const document of documents) {
    const assets = await collectLocalImageAssets(document.markdown);
    assets.forEach((asset) => assetsById.set(asset.id, asset));
  }
  return Array.from(assetsById.values());
}

function initialSelectedDocument(): SharkdownLibraryDocument | undefined {
  const state = useLibraryStore.getState();
  return state.library.documents.find((document) => document.id === state.selectedDocumentId);
}
