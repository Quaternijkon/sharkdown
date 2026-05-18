import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from './MarkdownEditor';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

describe('MarkdownEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('keeps document actions and exposes one fixed markdown toolbar', () => {
    render(<MarkdownEditor onNotice={vi.fn()} />);

    expect(screen.getByRole('button', { name: '恢复示例' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '插入本地图片' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Markdown 浮动工具栏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '加粗' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '任务清单' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /添加粗体文本/ })).not.toBeInTheDocument();
  });

  it('uses the floating toolbar to format selected text through editor commands', () => {
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: 'hello' });
    render(<MarkdownEditor onNotice={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: 'Markdown 编辑区' }) as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 5);
    fireEvent.click(screen.getByRole('button', { name: '加粗' }));

    expect(useEditorStore.getState().markdown).toBe('**hello**');
  });

  it('opens a custom context menu and inserts syntax templates instead of the browser menu', () => {
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: '' });
    render(<MarkdownEditor onNotice={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: 'Markdown 编辑区' });
    const allowedDefaultMenu = fireEvent.contextMenu(textarea, {
      clientX: 24,
      clientY: 32,
    });

    expect(allowedDefaultMenu).toBe(false);
    expect(screen.getByRole('menu', { name: 'Markdown 右键菜单' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Mermaid 流程图' }));

    expect(useEditorStore.getState().markdown).toContain('```mermaid');
    expect(useEditorStore.getState().markdown).toContain('flowchart LR');
  });
});
