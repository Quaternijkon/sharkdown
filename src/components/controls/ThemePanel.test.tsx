import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemePanel } from './ThemePanel';
import { themePresets } from '../../themes/presets';

describe('ThemePanel', () => {
  it('renders compact theme swatch buttons without repeating every description', () => {
    render(<ThemePanel />);

    for (const theme of themePresets) {
      expect(screen.getByLabelText(`选择主题：${theme.name}`)).toBeInTheDocument();
      expect(screen.queryByText(theme.description)).not.toBeInTheDocument();
    }

    expect(screen.getByText('Claude 暖纸')).toBeInTheDocument();
  });
});
