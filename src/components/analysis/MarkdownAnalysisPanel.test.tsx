import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownAnalysisPanel } from './MarkdownAnalysisPanel';

describe('MarkdownAnalysisPanel', () => {
  it('renders a standalone analysis dashboard with richer metrics and visual sections', () => {
    render(
      <MarkdownAnalysisPanel
        markdown={`# Roadmap

Intro paragraph with [link](https://example.com).

## Tasks

- [x] Draft
- [ ] Review

## Code

\`\`\`ts
const ok = true;
\`\`\`
`}
      />,
    );

    expect(screen.getByRole('heading', { name: '文档画像' })).toBeInTheDocument();
    expect(screen.getByText('语法覆盖')).toBeInTheDocument();
    expect(screen.getByText('阅读时长')).toBeInTheDocument();
    expect(screen.getByText('内容构成')).toBeInTheDocument();
    expect(screen.getByText('语法坐标')).toBeInTheDocument();
    expect(screen.getByText('分享可用性')).toBeInTheDocument();
    expect(screen.getByText('ts')).toBeInTheDocument();
  });
});
