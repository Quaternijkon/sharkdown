import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemePanel } from './ThemePanel';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';
import { themePresets } from '../../themes/presets';

describe('ThemePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('renders compact theme swatch buttons without repeating every description', () => {
    render(<ThemePanel />);

    for (const theme of themePresets) {
      expect(screen.getByLabelText(`选择主题：${theme.name}`)).toBeInTheDocument();
      expect(screen.queryByText(theme.description)).not.toBeInTheDocument();
    }

    expect(screen.getByText('Claude 暖纸')).toBeInTheDocument();
  });

  it('does not expose the removed People Daily layout mode', () => {
    render(<ThemePanel />);

    expect(screen.queryByRole('button', { name: '人民日报排版' })).not.toBeInTheDocument();
    expect(screen.queryByText('版式')).not.toBeInTheDocument();
  });
});
