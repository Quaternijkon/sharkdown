import { create } from 'zustand';

import type { DocumentState } from '../types';
import {
  archiveDocument as archiveLibraryDocument,
  createDocumentFromState,
  createFolder as createLibraryFolder,
  deleteFolder as deleteLibraryFolder,
  duplicateDocument as duplicateLibraryDocument,
  importLibraryBackup as importLibraryBackupData,
  loadLibrary,
  moveDocumentToFolder as moveLibraryDocumentToFolder,
  renameFolder as renameLibraryFolder,
  restoreDocument as restoreLibraryDocument,
  saveLibrary,
  searchDocuments,
  toggleFolderCollapsed as toggleLibraryFolderCollapsed,
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
  folderId?: string;
}

interface SaveDocumentArgs {
  title?: string;
  markdown: string;
  state: DocumentState;
  tags: string[];
  folderId?: string;
}

interface LibraryStore {
  library: SharkdownLibrary;
  selectedDocumentId?: string;
  selectedFolderId?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectFolder: (folderId: string | undefined) => void;
  createFolder: (name: string, parentId?: string) => string;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderCollapsed: (folderId: string) => void;
  moveDocumentToFolder: (documentId: string, folderId: string | undefined) => void;
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
  selectedFolderId: undefined,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectFolder: (folderId) => set({ selectedFolderId: folderId }),
  createFolder: (name, parentId) => {
    let newId = '';
    set((state) => {
      const before = state.library.folders.length;
      const library = createLibraryFolder(state.library, { name, parentId });
      newId = library.folders[before]?.id ?? '';
      saveLibrary(library);
      return {
        library,
        selectedFolderId: newId || parentId,
      };
    });
    return newId;
  },
  renameFolder: (folderId, name) => {
    set((state) => {
      const library = renameLibraryFolder(state.library, folderId, name);
      saveLibrary(library);
      return { library };
    });
  },
  deleteFolder: (folderId) => {
    set((state) => {
      const library = deleteLibraryFolder(state.library, folderId);
      saveLibrary(library);
      return {
        library,
        selectedFolderId:
          state.selectedFolderId && library.folders.some((folder) => folder.id === state.selectedFolderId)
            ? state.selectedFolderId
            : undefined,
      };
    });
  },
  toggleFolderCollapsed: (folderId) => {
    set((state) => {
      const library = toggleLibraryFolderCollapsed(state.library, folderId);
      saveLibrary(library);
      return { library };
    });
  },
  moveDocumentToFolder: (documentId, folderId) => {
    set((state) => {
      const library = moveLibraryDocumentToFolder(state.library, documentId, folderId);
      saveLibrary(library);
      return { library };
    });
  },
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
      selectedFolderId: undefined,
      searchQuery: '',
    });
    return result;
  },
  visibleDocuments: () => searchDocuments(get().library, get().searchQuery),
}));
