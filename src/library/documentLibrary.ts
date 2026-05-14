import type { DocumentState } from '../types';

export const LIBRARY_VERSION = 2;
export const LIBRARY_STORAGE_KEY = 'sharkdown-library-v2';

export interface SharkdownLibraryDocument {
  id: string;
  title: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface SharkdownLibrary {
  version: typeof LIBRARY_VERSION;
  documents: SharkdownLibraryDocument[];
  currentDocumentId?: string;
}

export interface CreateDocumentInput {
  id?: string;
  title: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
  now?: string;
}

export function createEmptyLibrary(): SharkdownLibrary {
  return {
    version: LIBRARY_VERSION,
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
    createdAt: now,
    updatedAt: now,
  };
}

export function updateDocumentContent(
  library: SharkdownLibrary,
  documentId: string,
  patch: SharkdownLibraryDocument | Partial<Pick<SharkdownLibraryDocument, 'title' | 'markdown' | 'state' | 'tags'>> & {
    now?: string;
  },
): SharkdownLibrary {
  const now = 'now' in patch && patch.now ? patch.now : new Date().toISOString();
  const existingIndex = library.documents.findIndex((document) => document.id === documentId);
  const existing = existingIndex >= 0 ? library.documents[existingIndex] : undefined;
  const nextDocument: SharkdownLibraryDocument = {
    id: documentId,
    title: normalizeTitle(patch.title ?? existing?.title ?? 'Untitled', patch.markdown ?? existing?.markdown ?? ''),
    markdown: patch.markdown ?? existing?.markdown ?? '',
    state: patch.state ?? existing?.state ?? (patch as SharkdownLibraryDocument).state,
    tags: uniqueTags(patch.tags ?? existing?.tags ?? []),
    createdAt: existing?.createdAt ?? ('createdAt' in patch ? patch.createdAt : now),
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
  });
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
    if (parsed.version !== LIBRARY_VERSION || !Array.isArray(parsed.documents)) {
      return createEmptyLibrary();
    }
    return parsed as SharkdownLibrary;
  } catch {
    return createEmptyLibrary();
  }
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
