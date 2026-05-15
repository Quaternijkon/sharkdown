import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT_STATE } from '../store/useEditorStore';
import { createDocumentFromState, createEmptyLibrary, serializeLibraryBackup, updateDocumentContent } from './documentLibrary';
import { useLibraryStore } from './useLibraryStore';

describe('useLibraryStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({
      library: createEmptyLibrary(),
      selectedDocumentId: undefined,
      searchQuery: '',
      selectedFolderId: undefined,
    });
  });

  it('creates, updates, selects, archives, and restores documents', () => {
    const id = useLibraryStore.getState().createDocument({
      title: 'Draft',
      markdown: '# Draft',
      state: DEFAULT_DOCUMENT_STATE,
      tags: ['share'],
    });

    useLibraryStore.getState().saveDocument(id, {
      markdown: '# Draft\n\nUpdated',
      state: { ...DEFAULT_DOCUMENT_STATE, themeId: 'google' },
      tags: ['share', 'phase2'],
    });

    expect(useLibraryStore.getState().selectedDocumentId).toBe(id);
    expect(useLibraryStore.getState().library.documents[0]?.markdown).toContain('Updated');

    useLibraryStore.getState().archiveDocument(id);
    expect(useLibraryStore.getState().library.documents[0]?.archivedAt).toBeDefined();
    expect(useLibraryStore.getState().selectedDocumentId).toBeUndefined();

    useLibraryStore.getState().restoreDocument(id);
    expect(useLibraryStore.getState().selectedDocumentId).toBe(id);
    expect(useLibraryStore.getState().library.documents[0]?.archivedAt).toBeUndefined();
  });

  it('imports a library backup into store state and persists the merged library', () => {
    const backupLibrary = updateDocumentContent(
      createEmptyLibrary(),
      'doc_imported',
      createDocumentFromState({
        id: 'doc_imported',
        title: 'Imported',
        markdown: '# Imported',
        state: DEFAULT_DOCUMENT_STATE,
        tags: ['backup'],
        now: '2026-05-15T00:00:00.000Z',
      }),
    );

    const result = useLibraryStore.getState().importLibraryBackup(serializeLibraryBackup(backupLibrary));

    expect(result.imported).toBe(1);
    expect(useLibraryStore.getState().library.documents[0]?.title).toBe('Imported');
    expect(useLibraryStore.getState().selectedDocumentId).toBe('doc_imported');
    expect(localStorage.getItem('sharkdown-library-v2')).toContain('Imported');
  });

  it('creates folders and moves documents between virtual folders', () => {
    const folderId = useLibraryStore.getState().createFolder('Ideas');
    const documentId = useLibraryStore.getState().createDocument({
      title: 'Draft',
      markdown: '# Draft',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
    });

    useLibraryStore.getState().moveDocumentToFolder(documentId, folderId);

    expect(useLibraryStore.getState().library.folders[0]?.name).toBe('Ideas');
    expect(useLibraryStore.getState().library.documents[0]?.folderId).toBe(folderId);
  });

  it('renames and deletes virtual folders without removing documents', () => {
    const folderId = useLibraryStore.getState().createFolder('Drafts');
    const documentId = useLibraryStore.getState().createDocument({
      title: 'Draft',
      markdown: '# Draft',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
      folderId,
    });

    useLibraryStore.getState().renameFolder(folderId, 'Published');
    useLibraryStore.getState().deleteFolder(folderId);

    expect(useLibraryStore.getState().library.folders).toHaveLength(0);
    expect(useLibraryStore.getState().library.documents.find((document) => document.id === documentId)?.folderId).toBeUndefined();
    expect(useLibraryStore.getState().selectedFolderId).toBeUndefined();
  });
});
