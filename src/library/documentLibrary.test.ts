import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT_STATE } from '../store/useEditorStore';
import {
  archiveDocument,
  createDocumentFromState,
  createEmptyLibrary,
  duplicateDocument,
  loadLibrary,
  restoreDocument,
  saveLibrary,
  searchDocuments,
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
    expect(loadLibrary().version).toBe(2);
  });
});
