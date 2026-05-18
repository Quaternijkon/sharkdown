import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from './MarkdownEditor';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

describe('MarkdownEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('keeps document actions but does not render the old custom formatting toolbar', () => {
    render(<MarkdownEditor onNotice={vi.fn()} />);

    expect(screen.getByRole('button', { name: '恢复示例' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '插入本地图片' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '二级标题' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '任务清单' })).not.toBeInTheDocument();
  });
});
