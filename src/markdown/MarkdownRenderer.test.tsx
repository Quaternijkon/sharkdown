import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer math', () => {
  it('renders inline and block formulas through KaTeX after sanitizing raw html', () => {
    const { container } = render(
      <MarkdownRenderer
        allowRawHtml
        markdown={
          '<span onclick="alert(1)">safe</span>\n\nInline $E = mc^2$.\n\n$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$'
        }
      />,
    );

    expect(screen.getByText('safe')).not.toHaveAttribute('onclick');
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
    expect(container.querySelector('.katex-display')).not.toBeNull();
    expect(container.querySelector('math')).not.toBeNull();
  });

  it('preserves local image references for the IndexedDB resolver', () => {
    const { container } = render(
      <MarkdownRenderer
        allowRawHtml={false}
        markdown="![diagram](local-image://img_123/diagram%20draft.png)"
      />,
    );

    expect(container.querySelector('.sharkdown-local-image-loading')).not.toBeNull();
    expect(container.querySelector('img[src^="local-image://"]')).toBeNull();
  });
});
