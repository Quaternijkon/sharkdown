import { create } from 'zustand';

import type { DocumentState } from '../types';
import {
  archiveDocument as archiveLibraryDocument,
  createDocumentFromState,
  duplicateDocument as duplicateLibraryDocument,
  importLibraryBackup as importLibraryBackupData,
  loadLibrary,
  restoreDocument as restoreLibraryDocument,
  saveLibrary,
  searchDocuments,
  updateDocumentContent,
  type ImportLibraryResult,
  type SharkdownLibrary,
  type SharkdownLibraryDocument,
} from './documentLibrary';

interface CreateDocumentArgs {
  title: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
}

interface SaveDocumentArgs {
  title?: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
}

interface LibraryStore {
  library: SharkdownLibrary;
  selectedDocumentId?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createDocument: (input: CreateDocumentArgs) => string;
  saveDocument: (documentId: string, input: SaveDocumentArgs) => void;
  selectDocument: (documentId: string | undefined) => void;
  archiveDocument: (documentId: string) => void;
  restoreDocument: (documentId: string) => void;
  duplicateDocument: (documentId: string) => string | undefined;
  importLibraryBackup: (raw: string) => ImportLibraryResult;
  visibleDocuments: () => SharkdownLibraryDocument[];
}

const initialLibrary = loadLibrary();

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  library: initialLibrary,
  selectedDocumentId: initialLibrary.currentDocumentId,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  createDocument: (input) => {
    const document = createDocumentFromState(input);
    set((state) => {
      const library = updateDocumentContent(state.library, document.id, document);
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: document.id,
      };
    });
    return document.id;
  },
  saveDocument: (documentId, input) => {
    set((state) => {
      const library = updateDocumentContent(state.library, documentId, input);
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: documentId,
      };
    });
  },
  selectDocument: (documentId) => {
    set((state) => {
      const library = {
        ...state.library,
        currentDocumentId: documentId,
      };
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: documentId,
      };
    });
  },
  archiveDocument: (documentId) => {
    set((state) => {
      const library = archiveLibraryDocument(state.library, documentId);
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: library.currentDocumentId,
      };
    });
  },
  restoreDocument: (documentId) => {
    set((state) => {
      const library = restoreLibraryDocument(state.library, documentId);
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: documentId,
      };
    });
  },
  duplicateDocument: (documentId) => {
    const before = get().library.documents.length;
    let newId: string | undefined;
    set((state) => {
      const library = duplicateLibraryDocument(state.library, documentId);
      if (library.documents.length > before) {
        newId = library.documents.at(-1)?.id;
      }
      saveLibrary(library);
      return {
        library,
        selectedDocumentId: newId ?? state.selectedDocumentId,
      };
    });
    return newId;
  },
  importLibraryBackup: (raw) => {
    const result = importLibraryBackupData(get().library, raw);
    saveLibrary(result.library);
    set({
      library: result.library,
      selectedDocumentId: result.library.currentDocumentId,
      searchQuery: '',
    });
    return result;
  },
  visibleDocuments: () => searchDocuments(get().library, get().searchQuery),
}));
