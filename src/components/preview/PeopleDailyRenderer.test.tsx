import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PeopleDailyRenderer } from './PeopleDailyRenderer';

describe('PeopleDailyRenderer', () => {
  it('renders a masthead and long-article page for long content', () => {
    render(
      <PeopleDailyRenderer
        markdown={`# 以更完善的制度体系推动内容自动排版在不同媒介场景中稳定生成高质量分享版面

正文段落。

正文段落。

正文段落。`}
      />,
    );

    expect(screen.getByText('人民日报')).toBeInTheDocument();
    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'long-article');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('制度体系');
  });

  it('renders front-page stories for multi-section content', () => {
    render(
      <PeopleDailyRenderer
        markdown={`# 今日要闻

## 新闻一
正文。

## 新闻二
正文。

## 新闻三
正文。`}
      />,
    );

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
    expect(screen.getByText('新闻一')).toBeInTheDocument();
    expect(screen.getByText('新闻二')).toBeInTheDocument();
    expect(screen.getByText('新闻三')).toBeInTheDocument();
  });

  it('renders continuation pages for long content', () => {
    const paragraphs = Array.from({ length: 38 }, (_, index) => `第${index + 1}段。`).join('\n\n');

    render(<PeopleDailyRenderer markdown={`# 长文章\n\n${paragraphs}`} />);

    expect(screen.getAllByLabelText(/人民日报版面/)).toHaveLength(3);
    expect(screen.getByText('第 2 版')).toBeInTheDocument();
  });
});
