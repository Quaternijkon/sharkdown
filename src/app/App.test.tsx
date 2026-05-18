import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { DEFAULT_DOCUMENT_STATE, useEditorStore } from '../store/useEditorStore';

describe('App header', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.setState(DEFAULT_DOCUMENT_STATE);
  });

  it('shows the Sharkdown slogan and GitHub repository link', () => {
    render(<App />);

    expect(screen.getByText('share markdown！')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub 仓库' })).toHaveAttribute(
      'href',
      'https://github.com/Quaternijkon/sharkdown',
    );
  });
});
