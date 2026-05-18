import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PreviewFrame } from './PreviewFrame';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

describe('PreviewFrame', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('renders the normal markdown renderer by default', () => {
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: '# Normal Preview' });

    render(<PreviewFrame />);

    expect(screen.getByRole('heading', { level: 1, name: 'Normal Preview' })).toBeInTheDocument();
    expect(screen.queryByTestId('people-daily-layout')).not.toBeInTheDocument();
  });

  it('renders People Daily layout when selected', () => {
    useEditorStore.setState({
      ...DEFAULT_DOCUMENT_STATE,
      layoutMode: 'people-daily',
      markdown: '# 今日要闻\n\n## 新闻一\n正文。\n\n## 新闻二\n正文。\n\n## 新闻三\n正文。',
    });

    render(<PreviewFrame />);

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
  });
});
