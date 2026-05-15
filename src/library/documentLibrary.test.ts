import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT_STATE } from '../store/useEditorStore';
import {
  archiveDocument,
  createDocumentFromState,
  createEmptyLibrary,
  createFolder,
  buildLibraryTree,
  deleteFolder,
  importLibraryBackup,
  duplicateDocument,
  hasUnsavedDocumentChanges,
  loadLibrary,
  moveDocumentToFolder,
  renameFolder,
  restoreDocument,
  saveLibrary,
  searchDocuments,
  serializeLibraryBackup,
  updateDocumentContent,
} from './documentLibrary';

describe('local document library', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates, updates, searches, archives, restores, and duplicates documents', () => {
    const library = createEmptyLibrary();
    const document = createDocumentFromState({
      title: 'Meeting Notes',
      markdown: '# Meeting Notes\n\nAction items for Share Markdown.',
      state: { ...DEFAULT_DOCUMENT_STATE, themeId: 'apple' },
      tags: ['work', 'share'],
      now: '2026-05-14T00:00:00.000Z',
    });

    const withDocument = updateDocumentContent(library, document.id, document);
    const updated = updateDocumentContent(withDocument, document.id, {
      markdown: '# Meeting Notes\n\nUpdated body.',
      tags: ['work'],
      now: '2026-05-14T00:05:00.000Z',
    });

    expect(searchDocuments(updated, 'updated')).toHaveLength(1);
    expect(searchDocuments(updated, 'share')).toHaveLength(0);

    const archived = archiveDocument(updated, document.id, '2026-05-14T00:06:00.000Z');
    expect(archived.documents[0]?.archivedAt).toBe('2026-05-14T00:06:00.000Z');
    expect(searchDocuments(archived, 'Meeting')).toHaveLength(0);

    const restored = restoreDocument(archived, document.id);
    expect(restored.documents[0]?.archivedAt).toBeUndefined();

    const duplicated = duplicateDocument(restored, document.id, '2026-05-14T00:07:00.000Z');
    expect(duplicated.documents).toHaveLength(2);
    expect(duplicated.documents[1]?.title).toBe('Meeting Notes 副本');
  });

  it('persists a versioned library in localStorage', () => {
    const library = updateDocumentContent(
      createEmptyLibrary(),
      'doc_manual',
      createDocumentFromState({
        id: 'doc_manual',
        title: 'Stored',
        markdown: 'Stored body',
        state: DEFAULT_DOCUMENT_STATE,
        tags: [],
        now: '2026-05-14T00:00:00.000Z',
      }),
    );

    saveLibrary(library);

    expect(loadLibrary().documents[0]?.title).toBe('Stored');
    expect(loadLibrary().version).toBe(3);
  });

  it('organizes documents in a virtual folder tree', () => {
    const folder = createFolder(createEmptyLibrary(), {
      id: 'folder_work',
      name: 'Work',
      now: '2026-05-15T00:00:00.000Z',
    });
    const renamed = renameFolder(folder, 'folder_work', 'Work Notes', '2026-05-15T00:01:00.000Z');
    const document = createDocumentFromState({
      id: 'doc_work',
      title: 'Weekly',
      markdown: '# Weekly',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
      now: '2026-05-15T00:02:00.000Z',
    });
    const withDocument = updateDocumentContent(renamed, document.id, document);
    const moved = moveDocumentToFolder(withDocument, document.id, 'folder_work');
    const tree = buildLibraryTree(moved, '');

    expect(moved.folders[0]).toMatchObject({ id: 'folder_work', name: 'Work Notes' });
    expect(moved.documents[0]?.folderId).toBe('folder_work');
    expect(tree.folders[0]?.documents[0]?.title).toBe('Weekly');
    expect(tree.rootDocuments).toHaveLength(0);
  });

  it('removes a virtual folder without deleting its documents', () => {
    const libraryWithFolder = createFolder(createEmptyLibrary(), {
      id: 'folder_archive',
      name: 'Archive',
      now: '2026-05-15T00:00:00.000Z',
    });
    const libraryWithChild = createFolder(libraryWithFolder, {
      id: 'folder_child',
      name: 'Child',
      parentId: 'folder_archive',
      now: '2026-05-15T00:01:00.000Z',
    });
    const document = createDocumentFromState({
      id: 'doc_nested',
      title: 'Nested',
      markdown: '# Nested',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
      folderId: 'folder_child',
      now: '2026-05-15T00:02:00.000Z',
    });
    const withDocument = updateDocumentContent(libraryWithChild, document.id, document);

    const removed = deleteFolder(withDocument, 'folder_archive');

    expect(removed.folders).toHaveLength(0);
    expect(removed.documents[0]?.title).toBe('Nested');
    expect(removed.documents[0]?.folderId).toBeUndefined();
    expect(buildLibraryTree(removed, '').rootDocuments[0]?.id).toBe('doc_nested');
  });

  it('shows folders when the search query matches the folder name', () => {
    const library = createFolder(createEmptyLibrary(), {
      id: 'folder_research',
      name: 'Research Inbox',
      now: '2026-05-15T00:00:00.000Z',
    });

    const tree = buildLibraryTree(library, 'research');

    expect(tree.folders[0]?.name).toBe('Research Inbox');
  });

  it('exports and imports a portable library backup with newer imported documents winning conflicts', () => {
    const localLibrary = updateDocumentContent(
      createEmptyLibrary(),
      'doc_shared',
      createDocumentFromState({
        id: 'doc_shared',
        title: 'Local',
        markdown: '# Local',
        state: DEFAULT_DOCUMENT_STATE,
        tags: ['draft'],
        now: '2026-05-14T00:00:00.000Z',
      }),
    );
    const incomingLibrary = updateDocumentContent(
      updateDocumentContent(
        createEmptyLibrary(),
        'doc_shared',
        createDocumentFromState({
          id: 'doc_shared',
          title: 'Imported Newer',
          markdown: '# Imported Newer',
          state: { ...DEFAULT_DOCUMENT_STATE, themeId: 'google' },
          tags: ['backup'],
          now: '2026-05-15T00:00:00.000Z',
        }),
      ),
      'doc_new',
      createDocumentFromState({
        id: 'doc_new',
        title: 'New Device Note',
        markdown: '# New Device Note',
        state: DEFAULT_DOCUMENT_STATE,
        tags: [],
        now: '2026-05-15T00:01:00.000Z',
      }),
    );

    const backup = serializeLibraryBackup(incomingLibrary, {
      exportedAt: '2026-05-15T00:02:00.000Z',
      appVersion: '0.2.0-test',
      assets: [
        {
          id: 'img_1',
          fileName: 'diagram.png',
          mimeType: 'image/png',
          size: 12,
          dataUrl: 'data:image/png;base64,AA==',
        },
      ],
    });
    const result = importLibraryBackup(localLibrary, backup);

    expect(JSON.parse(backup)).toMatchObject({
      format: 'sharkdown-library',
      version: 1,
      exportedAt: '2026-05-15T00:02:00.000Z',
      appVersion: '0.2.0-test',
      assets: [
        {
          id: 'img_1',
          fileName: 'diagram.png',
          mimeType: 'image/png',
          size: 12,
          dataUrl: 'data:image/png;base64,AA==',
        },
      ],
    });
    expect(result.imported).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.library.documents.find((document) => document.id === 'doc_shared')?.title).toBe('Imported Newer');
    expect(result.library.documents.find((document) => document.id === 'doc_new')?.title).toBe('New Device Note');
  });

  it('keeps newer local documents when importing an older backup conflict', () => {
    const localLibrary = updateDocumentContent(
      createEmptyLibrary(),
      'doc_shared',
      createDocumentFromState({
        id: 'doc_shared',
        title: 'Local Newer',
        markdown: '# Local Newer',
        state: DEFAULT_DOCUMENT_STATE,
        tags: [],
        now: '2026-05-15T00:00:00.000Z',
      }),
    );
    const olderBackupLibrary = updateDocumentContent(
      createEmptyLibrary(),
      'doc_shared',
      createDocumentFromState({
        id: 'doc_shared',
        title: 'Imported Older',
        markdown: '# Imported Older',
        state: DEFAULT_DOCUMENT_STATE,
        tags: [],
        now: '2026-05-14T00:00:00.000Z',
      }),
    );

    const result = importLibraryBackup(localLibrary, serializeLibraryBackup(olderBackupLibrary));

    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.library.documents[0]?.title).toBe('Local Newer');
  });

  it('detects unsaved editor changes against the selected document', () => {
    const document = createDocumentFromState({
      id: 'doc_dirty',
      title: 'Saved',
      markdown: '# Saved',
      state: DEFAULT_DOCUMENT_STATE,
      tags: ['share'],
      now: '2026-05-15T00:00:00.000Z',
    });

    expect(
      hasUnsavedDocumentChanges(document, {
        title: 'Saved',
        markdown: '# Saved',
        state: DEFAULT_DOCUMENT_STATE,
        tags: ['share'],
      }),
    ).toBe(false);
    expect(
      hasUnsavedDocumentChanges(document, {
        title: 'Saved',
        markdown: '# Edited',
        state: DEFAULT_DOCUMENT_STATE,
        tags: ['share'],
      }),
    ).toBe(true);
  });
});
