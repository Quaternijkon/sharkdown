import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PreviewFrame } from './PreviewFrame';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../../store/useEditorStore';

describe('PreviewFrame', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('renders the normal markdown renderer only', () => {
    useEditorStore.setState({ ...DEFAULT_DOCUMENT_STATE, markdown: '# Normal Preview' });

    render(<PreviewFrame />);

    expect(screen.getByRole('heading', { level: 1, name: 'Normal Preview' })).toBeInTheDocument();
    expect(screen.queryByTestId('people-daily-layout')).not.toBeInTheDocument();
  });
});
