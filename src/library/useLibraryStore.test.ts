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
});
