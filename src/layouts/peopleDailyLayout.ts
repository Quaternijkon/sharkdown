export type PeopleDailyVariant = 'front-page' | 'long-article' | 'brief';

export interface PeopleDailyImage {
  alt: string;
  src: string;
}

export interface PeopleDailyStory {
  title: string;
  paragraphs: string[];
}

export interface PeopleDailyPage {
  pageNumber: number;
  paragraphs: string[];
}

export interface PeopleDailyDocument {
  title: string;
  subtitle: string;
  variant: PeopleDailyVariant;
  stories: PeopleDailyStory[];
  paragraphs: string[];
  images: PeopleDailyImage[];
  pages: PeopleDailyPage[];
}

const PAGE_PARAGRAPH_TARGET = 18;
const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function buildPeopleDailyDocument(markdown: string): PeopleDailyDocument {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const images = collectImages(markdown);
  const title = extractTitle(lines);
  const stories = collectStories(lines);
  const paragraphs = collectParagraphs(markdown);
  const subtitle = extractSubtitle(lines, title);
  const variant = selectVariant({ title, stories, paragraphs });
  const pages = paginateParagraphs(paragraphs);

  return {
    title,
    subtitle,
    variant,
    stories,
    paragraphs,
    images,
    pages,
  };
}

function extractTitle(lines: string[]): string {
  const heading = lines.find((line) => /^#\s+/.test(line.trim())) ?? lines.find((line) => /^#{1,3}\s+/.test(line.trim()));
  if (heading) {
    return heading.replace(/^#{1,6}\s+/, '').trim();
  }

  return lines.find((line) => line.trim().length > 0)?.trim() ?? '未命名文章';
}

function extractSubtitle(lines: string[], title: string): string {
  const candidates = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && line !== title);
  const quote = candidates.find((line) => line.startsWith('>'));
  if (quote) {
    return quote.replace(/^>\s?/, '').trim();
  }

  const firstShort = candidates.find((line) => stripMarkdown(line).length <= 48);
  return firstShort ? stripMarkdown(firstShort) : '';
}

function collectImages(markdown: string): PeopleDailyImage[] {
  return Array.from(markdown.matchAll(imagePattern), (match) => ({
    alt: match[1]?.trim() ?? '',
    src: match[2]?.trim() ?? '',
  }));
}

function collectStories(lines: string[]): PeopleDailyStory[] {
  const stories: PeopleDailyStory[] = [];
  let current: PeopleDailyStory | null = null;
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence || !line || line.startsWith('![')) {
      continue;
    }

    const storyHeading = /^#{2,3}\s+(.+)$/.exec(line);
    if (storyHeading) {
      current = { title: storyHeading[1].trim(), paragraphs: [] };
      stories.push(current);
      continue;
    }

    if (current && !line.startsWith('#') && !isStructuralMarkdown(line)) {
      current.paragraphs.push(stripMarkdown(line));
    }
  }

  return stories.filter((story) => story.title || story.paragraphs.length > 0);
}

function collectParagraphs(markdown: string): string[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '\n');
  const withoutImages = withoutCode.replace(imagePattern, '\n');

  return withoutImages
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !/^#{1,6}\s+/.test(line))
        .filter((line) => !isStructuralMarkdown(line))
        .map(stripMarkdown)
        .join(''),
    )
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function selectVariant(input: Pick<PeopleDailyDocument, 'title' | 'stories' | 'paragraphs'>): PeopleDailyVariant {
  const paragraphCount = input.paragraphs.length;
  const averageParagraphLength =
    paragraphCount === 0
      ? 0
      : input.paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0) / paragraphCount;

  if (paragraphCount <= 2 && input.stories.length <= 1 && input.title.length < 36) {
    return 'brief';
  }

  if (input.stories.length >= 3 && input.title.length < 48 && averageParagraphLength < 120) {
    return 'front-page';
  }

  return 'long-article';
}

function paginateParagraphs(paragraphs: string[]): PeopleDailyPage[] {
  const source = paragraphs.length > 0 ? paragraphs : [''];
  const pages: PeopleDailyPage[] = [];

  for (let index = 0; index < source.length; index += PAGE_PARAGRAPH_TARGET) {
    pages.push({
      pageNumber: pages.length + 1,
      paragraphs: source.slice(index, index + PAGE_PARAGRAPH_TARGET),
    });
  }

  return pages;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^>\s?/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function isStructuralMarkdown(line: string): boolean {
  return (
    line.startsWith('|') ||
    /^[-:| ]{3,}$/.test(line) ||
    /^\$\$/.test(line) ||
    /^[-*+]\s+\[[ xX]\]/.test(line)
  );
}
