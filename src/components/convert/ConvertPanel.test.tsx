import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConvertPanel } from './ConvertPanel';

describe('ConvertPanel', () => {
  it('shows platform presets and preflight results', () => {
    render(
      <ConvertPanel
        markdown={'# Hello\n\nText'}
        renderedHtml={'<h1>Hello</h1><p>Text</p>'}
        estimatedLocalAssetBytes={0}
        busy={false}
        onExportArtifacts={vi.fn()}
      />,
    );

    expect(screen.getByText('转换目标')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /小红书图文/ }));
    expect(screen.getByText('导出建议')).toBeInTheDocument();
    expect(screen.getByText('轮播拆分')).toBeInTheDocument();
  });
});
