import type { DocumentState } from '../types';
import type { SharkdownProjectAsset } from '../share/projectPackage';

export const LIBRARY_VERSION = 3;
export const LIBRARY_STORAGE_KEY = 'sharkdown-library-v2';
export const LIBRARY_BACKUP_FORMAT = 'sharkdown-library';
export const LIBRARY_BACKUP_VERSION = 1;

export interface SharkdownLibraryDocument {
  id: string;
  title: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface SharkdownLibraryFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  collapsed?: boolean;
}

export interface SharkdownLibrary {
  version: typeof LIBRARY_VERSION;
  folders: SharkdownLibraryFolder[];
  documents: SharkdownLibraryDocument[];
  currentDocumentId?: string;
}

export interface SharkdownLibraryTree {
  rootDocuments: SharkdownLibraryDocument[];
  folders: SharkdownLibraryFolderNode[];
}

export interface SharkdownLibraryFolderNode extends SharkdownLibraryFolder {
  documents: SharkdownLibraryDocument[];
  children: SharkdownLibraryFolderNode[];
}

export interface SharkdownLibraryBackup {
  format: typeof LIBRARY_BACKUP_FORMAT;
  version: typeof LIBRARY_BACKUP_VERSION;
  exportedAt: string;
  appVersion?: string;
  library: SharkdownLibrary;
  assets?: SharkdownProjectAsset[];
}

export interface ImportLibraryResult {
  library: SharkdownLibrary;
  imported: number;
  updated: number;
  skipped: number;
}

export interface CreateDocumentInput {
  id?: string;
  title: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
  folderId?: string;
  now?: string;
}

export interface CreateFolderInput {
  id?: string;
  name: string;
  parentId?: string;
  now?: string;
}

export function createEmptyLibrary(): SharkdownLibrary {
  return {
    version: LIBRARY_VERSION,
    folders: [],
    documents: [],
  };
}

export function createDocumentFromState(input: CreateDocumentInput): SharkdownLibraryDocument {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? createDocumentId(),
    title: normalizeTitle(input.title, input.markdown),
    markdown: input.markdown,
    state: input.state,
    tags: uniqueTags(input.tags),
    folderId: input.folderId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createFolder(library: SharkdownLibrary, input: CreateFolderInput): SharkdownLibrary {
  const normalized = normalizeLibrary(library);
  const now = input.now ?? new Date().toISOString();
  const folder: SharkdownLibraryFolder = {
    id: input.id ?? createFolderId(),
    name: normalizeFolderName(input.name),
    parentId: input.parentId && normalized.folders.some((item) => item.id === input.parentId) ? input.parentId : undefined,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...normalized,
    folders: [...normalized.folders, folder],
  };
}

export function renameFolder(
  library: SharkdownLibrary,
  folderId: string,
  name: string,
  now = new Date().toISOString(),
): SharkdownLibrary {
  const normalized = normalizeLibrary(library);
  return {
    ...normalized,
    folders: normalized.folders.map((folder) =>
      folder.id === folderId ? { ...folder, name: normalizeFolderName(name), updatedAt: now } : folder,
    ),
  };
}

export function deleteFolder(library: SharkdownLibrary, folderId: string): SharkdownLibrary {
  const normalized = normalizeLibrary(library);
  const removedFolderIds = collectDescendantFolderIds(normalized.folders, folderId);
  if (!removedFolderIds.size) {
    return normalized;
  }
  return {
    ...normalized,
    folders: normalized.folders.filter((folder) => !removedFolderIds.has(folder.id)),
    documents: normalized.documents.map((document) =>
      document.folderId && removedFolderIds.has(document.folderId)
        ? { ...document, folderId: undefined, updatedAt: new Date().toISOString() }
        : document,
    ),
  };
}

export function toggleFolderCollapsed(library: SharkdownLibrary, folderId: string): SharkdownLibrary {
  const normalized = normalizeLibrary(library);
  return {
    ...normalized,
    folders: normalized.folders.map((folder) =>
      folder.id === folderId ? { ...folder, collapsed: !folder.collapsed, updatedAt: new Date().toISOString() } : folder,
    ),
  };
}

export function moveDocumentToFolder(
  library: SharkdownLibrary,
  documentId: string,
  folderId: string | undefined,
): SharkdownLibrary {
  const normalized = normalizeLibrary(library);
  const targetFolderId = folderId && normalized.folders.some((folder) => folder.id === folderId) ? folderId : undefined;
  return {
    ...normalized,
    documents: normalized.documents.map((document) =>
      document.id === documentId ? { ...document, folderId: targetFolderId, updatedAt: new Date().toISOString() } : document,
    ),
  };
}

export function updateDocumentContent(
  library: SharkdownLibrary,
  documentId: string,
  patch: SharkdownLibraryDocument | Partial<Pick<SharkdownLibraryDocument, 'title' | 'markdown' | 'state' | 'tags' | 'folderId'>> & {
    now?: string;
  },
): SharkdownLibrary {
  const patchDocument = patch as Partial<SharkdownLibraryDocument> & { now?: string };
  const now = patchDocument.now ?? patchDocument.updatedAt ?? new Date().toISOString();
  const existingIndex = library.documents.findIndex((document) => document.id === documentId);
  const existing = existingIndex >= 0 ? library.documents[existingIndex] : undefined;
  const state = patch.state ?? existing?.state ?? patchDocument.state;
  if (!state) {
    throw new Error('文档缺少状态快照。');
  }
  const nextDocument: SharkdownLibraryDocument = {
    id: documentId,
    title: normalizeTitle(patch.title ?? existing?.title ?? 'Untitled', patch.markdown ?? existing?.markdown ?? ''),
    markdown: patch.markdown ?? existing?.markdown ?? '',
    state,
    tags: uniqueTags(patch.tags ?? existing?.tags ?? []),
    folderId: patchDocument.folderId ?? existing?.folderId,
    createdAt: existing?.createdAt ?? patchDocument.createdAt ?? now,
    updatedAt: now,
    archivedAt: existing?.archivedAt,
  };

  const documents =
    existingIndex >= 0
      ? library.documents.map((document, index) => (index === existingIndex ? nextDocument : document))
      : [...library.documents, nextDocument];
  return {
    ...library,
    documents,
    currentDocumentId: documentId,
  };
}

export function archiveDocument(library: SharkdownLibrary, documentId: string, now = new Date().toISOString()) {
  return {
    ...library,
    documents: library.documents.map((document) =>
      document.id === documentId ? { ...document, archivedAt: now, updatedAt: now } : document,
    ),
    currentDocumentId: library.currentDocumentId === documentId ? undefined : library.currentDocumentId,
  };
}

export function restoreDocument(library: SharkdownLibrary, documentId: string): SharkdownLibrary {
  return {
    ...library,
    documents: library.documents.map((document) => {
      if (document.id !== documentId) {
        return document;
      }
      return { ...document, archivedAt: undefined, updatedAt: new Date().toISOString() };
    }),
    currentDocumentId: documentId,
  };
}

export function duplicateDocument(
  library: SharkdownLibrary,
  documentId: string,
  now = new Date().toISOString(),
): SharkdownLibrary {
  const source = library.documents.find((document) => document.id === documentId);
  if (!source) {
    return library;
  }
  const copy: SharkdownLibraryDocument = {
    ...source,
    id: createDocumentId(),
    title: `${source.title} 副本`,
    createdAt: now,
    updatedAt: now,
    archivedAt: undefined,
  };
  return {
    ...library,
    documents: [...library.documents, copy],
    currentDocumentId: copy.id,
  };
}

export function searchDocuments(library: SharkdownLibrary, query: string): SharkdownLibraryDocument[] {
  const normalized = query.trim().toLowerCase();
  return library.documents.filter((document) => {
    if (document.archivedAt) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return [document.title, document.markdown, document.tags.join(' ')]
      .join('\n')
      .toLowerCase()
      .includes(normalized);
  }).sort(sortByUpdatedAtDesc);
}

export function archivedDocuments(library: SharkdownLibrary): SharkdownLibraryDocument[] {
  return library.documents.filter((document) => document.archivedAt).sort(sortByUpdatedAtDesc);
}

export function buildLibraryTree(library: SharkdownLibrary, query: string): SharkdownLibraryTree {
  const normalized = normalizeLibrary(library);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (document: SharkdownLibraryDocument) =>
    !document.archivedAt &&
    (!normalizedQuery ||
      [document.title, document.markdown, document.tags.join(' ')].join('\n').toLowerCase().includes(normalizedQuery));
  const visibleDocuments = normalized.documents.filter(matches).sort(sortByUpdatedAtDesc);
  const foldersById = new Map<string, SharkdownLibraryFolderNode>();
  normalized.folders.forEach((folder) => {
    foldersById.set(folder.id, { ...folder, documents: [], children: [] });
  });

  const rootFolders: SharkdownLibraryFolderNode[] = [];
  foldersById.forEach((folder) => {
    if (folder.parentId && foldersById.has(folder.parentId)) {
      foldersById.get(folder.parentId)?.children.push(folder);
      return;
    }
    rootFolders.push(folder);
  });

  const rootDocuments: SharkdownLibraryDocument[] = [];
  visibleDocuments.forEach((document) => {
    if (document.folderId && foldersById.has(document.folderId)) {
      foldersById.get(document.folderId)?.documents.push(document);
      return;
    }
    rootDocuments.push(document);
  });

  const sortNode = (node: SharkdownLibraryFolderNode) => {
    node.children.sort(sortFoldersByName).forEach(sortNode);
    node.documents.sort(sortByUpdatedAtDesc);
  };
  rootFolders.sort(sortFoldersByName).forEach(sortNode);

  if (!normalizedQuery) {
    return { rootDocuments, folders: rootFolders };
  }
  return {
    rootDocuments,
    folders: rootFolders
      .map((node) => filterTreeNode(node, normalizedQuery))
      .filter((node): node is SharkdownLibraryFolderNode => node !== undefined),
  };
}

export function serializeLibraryBackup(
  library: SharkdownLibrary,
  options: { exportedAt?: string; appVersion?: string; assets?: SharkdownProjectAsset[] } = {},
): string {
  const backup: SharkdownLibraryBackup = {
    format: LIBRARY_BACKUP_FORMAT,
    version: LIBRARY_BACKUP_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    appVersion: options.appVersion,
    library: normalizeLibrary(library),
    assets: options.assets,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseLibraryBackup(raw: string): SharkdownLibraryBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('备份文件不是有效的 JSON。');
  }

  if (!isRecord(parsed) || parsed.format !== LIBRARY_BACKUP_FORMAT || parsed.version !== LIBRARY_BACKUP_VERSION) {
    throw new Error('备份文件格式不匹配。');
  }
  if (typeof parsed.exportedAt !== 'string' || !isRecord(parsed.library)) {
    throw new Error('备份文件缺少必要信息。');
  }

  return {
    format: LIBRARY_BACKUP_FORMAT,
    version: LIBRARY_BACKUP_VERSION,
    exportedAt: parsed.exportedAt,
    appVersion: typeof parsed.appVersion === 'string' ? parsed.appVersion : undefined,
    library: normalizeLibrary(parsed.library),
    assets: Array.isArray(parsed.assets) ? normalizeAssets(parsed.assets) : undefined,
  };
}

export function importLibraryBackup(currentLibrary: SharkdownLibrary, raw: string): ImportLibraryResult {
  const backup = parseLibraryBackup(raw);
  const current = normalizeLibrary(currentLibrary);
  const incoming = normalizeLibrary(backup.library);
  const documentsById = new Map(current.documents.map((document) => [document.id, document]));
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const document of incoming.documents) {
    const existing = documentsById.get(document.id);
    if (!existing) {
      documentsById.set(document.id, document);
      imported += 1;
      continue;
    }

    if (new Date(document.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      documentsById.set(document.id, document);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  const documents = Array.from(documentsById.values()).sort(sortByUpdatedAtDesc);
  const currentDocumentId =
    current.currentDocumentId && documents.some((document) => document.id === current.currentDocumentId)
      ? current.currentDocumentId
      : incoming.currentDocumentId && documents.some((document) => document.id === incoming.currentDocumentId)
        ? incoming.currentDocumentId
        : documents.find((document) => !document.archivedAt)?.id;

  return {
    library: {
      version: LIBRARY_VERSION,
      folders: mergeFolders(current.folders, incoming.folders),
      documents,
      currentDocumentId,
    },
    imported,
    updated,
    skipped,
  };
}

function mergeFolders(
  currentFolders: SharkdownLibraryFolder[],
  incomingFolders: SharkdownLibraryFolder[],
): SharkdownLibraryFolder[] {
  const foldersById = new Map(currentFolders.map((folder) => [folder.id, folder]));
  incomingFolders.forEach((folder) => {
    const existing = foldersById.get(folder.id);
    if (!existing || new Date(folder.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      foldersById.set(folder.id, folder);
    }
  });
  return Array.from(foldersById.values()).sort(sortFoldersByName);
}

export function hasUnsavedDocumentChanges(
  document: SharkdownLibraryDocument | undefined,
  input: Pick<SharkdownLibraryDocument, 'title' | 'markdown' | 'state' | 'tags'>,
): boolean {
  if (!document) {
    return input.markdown.trim().length > 0;
  }
  return (
    normalizeTitle(input.title, input.markdown) !== document.title ||
    input.markdown !== document.markdown ||
    JSON.stringify(input.state) !== JSON.stringify(document.state) ||
    JSON.stringify(uniqueTags(input.tags)) !== JSON.stringify(uniqueTags(document.tags))
  );
}

export function saveLibrary(library: SharkdownLibrary): void {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
}

export function loadLibrary(): SharkdownLibrary {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
      return createEmptyLibrary();
    }
    const parsed = JSON.parse(raw) as Partial<SharkdownLibrary>;
    if (!Array.isArray(parsed.documents)) {
      return createEmptyLibrary();
    }
    return normalizeLibrary(parsed);
  } catch {
    return createEmptyLibrary();
  }
}

function normalizeLibrary(value: unknown): SharkdownLibrary {
  if (!isRecord(value) || !Array.isArray(value.documents)) {
    return createEmptyLibrary();
  }

  return {
    version: LIBRARY_VERSION,
    folders: Array.isArray(value.folders) ? value.folders.map(normalizeFolder).filter((folder) => folder !== undefined) : [],
    documents: value.documents.map(normalizeDocument).filter((document) => document !== undefined),
    currentDocumentId: typeof value.currentDocumentId === 'string' ? value.currentDocumentId : undefined,
  };
}

function normalizeFolder(value: unknown): SharkdownLibraryFolder | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return undefined;
  }
  const now = new Date().toISOString();
  return {
    id: value.id,
    name: normalizeFolderName(typeof value.name === 'string' ? value.name : '未命名文件夹'),
    parentId: typeof value.parentId === 'string' ? value.parentId : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    collapsed: typeof value.collapsed === 'boolean' ? value.collapsed : undefined,
  };
}

function normalizeDocument(value: unknown): SharkdownLibraryDocument | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.markdown !== 'string') {
    return undefined;
  }
  const now = new Date().toISOString();
  const state = isRecord(value.state) ? (value.state as unknown as DocumentState) : undefined;
  if (!state) {
    return undefined;
  }
  return {
    id: value.id,
    title: normalizeTitle(typeof value.title === 'string' ? value.title : '', value.markdown),
    markdown: value.markdown,
    state,
    tags: Array.isArray(value.tags) ? uniqueTags(value.tags.filter((tag): tag is string => typeof tag === 'string')) : [],
    folderId: typeof value.folderId === 'string' ? value.folderId : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    archivedAt: typeof value.archivedAt === 'string' ? value.archivedAt : undefined,
  };
}

function normalizeAssets(value: unknown[]): SharkdownProjectAsset[] {
  return value.filter(isBackupAsset);
}

function isBackupAsset(value: unknown): value is SharkdownProjectAsset {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.size === 'number' &&
    typeof value.dataUrl === 'string'
  );
}

function sortByUpdatedAtDesc(a: SharkdownLibraryDocument, b: SharkdownLibraryDocument): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function sortFoldersByName(a: SharkdownLibraryFolder, b: SharkdownLibraryFolder): number {
  return a.name.localeCompare(b.name, 'zh-CN');
}

function filterTreeNode(
  node: SharkdownLibraryFolderNode,
  normalizedQuery: string,
): SharkdownLibraryFolderNode | undefined {
  const children = node.children
    .map((child) => filterTreeNode(child, normalizedQuery))
    .filter((child): child is SharkdownLibraryFolderNode => child !== undefined);
  const matchesFolderName = node.name.toLowerCase().includes(normalizedQuery);
  if (node.documents.length === 0 && children.length === 0 && !matchesFolderName) {
    return undefined;
  }
  return { ...node, children };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeTitle(title: string, markdown: string): string {
  const heading = /^#\s+(.+)$/m.exec(markdown)?.[1];
  return (title || heading || 'Untitled').trim() || 'Untitled';
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function createDocumentId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function createFolderId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `folder_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function normalizeFolderName(name: string): string {
  return name.trim() || '未命名文件夹';
}

function collectDescendantFolderIds(folders: SharkdownLibraryFolder[], folderId: string): Set<string> {
  const removed = new Set<string>();
  const visit = (id: string) => {
    if (removed.has(id)) {
      return;
    }
    if (!folders.some((folder) => folder.id === id)) {
      return;
    }
    removed.add(id);
    folders.filter((folder) => folder.parentId === id).forEach((folder) => visit(folder.id));
  };
  visit(folderId);
  return removed;
}
