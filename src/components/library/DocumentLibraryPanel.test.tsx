import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentLibraryPanel } from './DocumentLibraryPanel';
import { createDocumentFromState, createEmptyLibrary, createFolder, updateDocumentContent } from '../../library/documentLibrary';
import { useLibraryStore } from '../../library/useLibraryStore';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

describe('DocumentLibraryPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({
      library: createEmptyLibrary(),
      selectedDocumentId: undefined,
      searchQuery: '',
    });
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('shows current document metadata, dirty status, and portable backup actions', () => {
    const document = createDocumentFromState({
      id: 'doc_panel',
      title: 'Saved Note',
      markdown: '# Saved Note',
      state: DEFAULT_DOCUMENT_STATE,
      tags: ['backup'],
      now: '2026-05-15T00:00:00.000Z',
    });
    useLibraryStore.setState({
      library: updateDocumentContent(createEmptyLibrary(), document.id, document),
      selectedDocumentId: document.id,
    });
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: '# Edited Note' });

    render(<DocumentLibraryPanel onNotice={vi.fn()} />);

    expect(screen.getByDisplayValue('Saved Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('backup')).toBeInTheDocument();
    expect(screen.getByText('未保存')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出文档库备份' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导入文档库备份' })).toBeInTheDocument();
  });

  it('asks before leaving an unsaved document', () => {
    const first = createDocumentFromState({
      id: 'doc_first',
      title: 'First',
      markdown: '# First',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
      now: '2026-05-15T00:00:00.000Z',
    });
    const second = createDocumentFromState({
      id: 'doc_second',
      title: 'Second',
      markdown: '# Second',
      state: DEFAULT_DOCUMENT_STATE,
      tags: [],
      now: '2026-05-15T00:01:00.000Z',
    });
    const library = updateDocumentContent(
      updateDocumentContent(createEmptyLibrary(), first.id, first),
      second.id,
      second,
    );
    useLibraryStore.setState({ library, selectedDocumentId: first.id });
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: '# Edited First' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<DocumentLibraryPanel onNotice={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Second/ }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(useEditorStore.getState().markdown).toBe('# Edited First');
  });

  it('manages selected virtual folders from the library panel', () => {
    const library = createFolder(createEmptyLibrary(), {
      id: 'folder_notes',
      name: 'Notes',
      now: '2026-05-15T00:00:00.000Z',
    });
    useLibraryStore.setState({ library, selectedFolderId: 'folder_notes' });
    const notice = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DocumentLibraryPanel onNotice={notice} />);

    fireEvent.change(screen.getByRole('textbox', { name: '文件夹新名称' }), { target: { value: 'Ideas' } });
    fireEvent.click(screen.getByRole('button', { name: '重命名选中文件夹' }));
    fireEvent.click(screen.getByRole('button', { name: '移除选中文件夹' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(useLibraryStore.getState().library.folders).toHaveLength(0);
    expect(notice).toHaveBeenCalledWith('文件夹已移除，内部文档已保留到根目录。', 'success');
  });
});
