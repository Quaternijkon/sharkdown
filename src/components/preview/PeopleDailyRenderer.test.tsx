import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PeopleDailyRenderer } from './PeopleDailyRenderer';

describe('PeopleDailyRenderer', () => {
  it('renders a masthead and long-article page for long content', () => {
    render(
      <PeopleDailyRenderer
        markdown={`# A Very Long Article Headline For Automatic Newspaper Typesetting

First body paragraph.

Second body paragraph.

Third body paragraph.`}
      />,
    );

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'long-article');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Automatic Newspaper');
  });

  it('renders front-page stories for multi-section content', () => {
    render(
      <PeopleDailyRenderer
        markdown={`# Daily Brief

## Story One
Body one.

## Story Two
Body two.

## Story Three
Body three.`}
      />,
    );

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
    expect(screen.getByText('Story One')).toBeInTheDocument();
    expect(screen.getByText('Story Two')).toBeInTheDocument();
    expect(screen.getByText('Story Three')).toBeInTheDocument();
  });

  it('renders continuation pages for long content', () => {
    const paragraphs = Array.from({ length: 38 }, (_, index) => `Paragraph ${index + 1}.`).join('\n\n');
    const { container } = render(<PeopleDailyRenderer markdown={`# Long Article\n\n${paragraphs}`} />);

    expect(container.querySelectorAll('.people-daily-page')).toHaveLength(3);
  });

  it('keeps every front-page story by continuing beyond the first newspaper page', () => {
    const sections = Array.from(
      { length: 8 },
      (_, index) => `## Story ${index + 1}\nBody ${index + 1} first paragraph.\n\nBody ${index + 1} second paragraph.`,
    ).join('\n\n');
    const { container } = render(<PeopleDailyRenderer markdown={`# Daily Brief\n\n${sections}`} />);

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
    expect(container.querySelectorAll('.people-daily-page').length).toBeGreaterThan(1);

    for (let index = 1; index <= 8; index += 1) {
      expect(screen.getAllByText(`Story ${index}`).length).toBeGreaterThan(0);
      expect(screen.getByText(`Body ${index} second paragraph.`)).toBeInTheDocument();
    }
  });

  it('does not invent an image block when the source has no image', () => {
    const { container } = render(
      <PeopleDailyRenderer
        markdown={`# Daily Brief

## Story 1
Body 1.

## Story 2
Body 2.

## Story 3
Body 3.`}
      />,
    );

    expect(screen.getByTestId('people-daily-layout')).toHaveAttribute('data-variant', 'front-page');
    expect(container.querySelector('.people-daily-photo--empty')).not.toBeInTheDocument();
  });
});
