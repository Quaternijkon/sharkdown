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
  const heading =
    lines.find((line) => /^#\s+/.test(line.trim())) ??
    lines.find((line) => /^#{1,3}\s+/.test(line.trim()));
  if (heading) {
    return heading.replace(/^#{1,6}\s+/, '').trim();
  }

  return lines.find((line) => line.trim().length > 0)?.trim() ?? 'Untitled Article';
}

function extractSubtitle(lines: string[], title: string): string {
  const candidates = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && line !== title);
  const quote = candidates.find((line) => line.startsWith('>'));
  if (quote) {
    return quote.replace(/^>\s?/, '').trim();
  }

  return '';
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
  let codeLanguage = '';
  let codeLines: string[] = [];
  let tableLines: string[] = [];
  let formulaLines: string[] = [];
  let inFormula = false;

  function pushToCurrent(text: string) {
    if (current && text.trim()) {
      current.paragraphs.push(text.trim());
    }
  }

  function flushTable() {
    const table = formatTable(tableLines);
    if (table) {
      pushToCurrent(table);
    }
    tableLines = [];
  }

  function flushFormula() {
    if (formulaLines.length > 0) {
      pushToCurrent(`Formula: ${formulaLines.join(' ')}`);
    }
    formulaLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      if (!inCodeFence) {
        flushTable();
        flushFormula();
        inCodeFence = true;
        codeLanguage = line.replace(/^```/, '').trim();
        codeLines = [];
      } else {
        pushToCurrent(formatCodeBlock(codeLanguage, codeLines));
        inCodeFence = false;
        codeLanguage = '';
        codeLines = [];
      }
      continue;
    }

    if (inCodeFence) {
      codeLines.push(rawLine);
      continue;
    }

    if (line.startsWith('$$')) {
      flushTable();
      if (!inFormula) {
        inFormula = true;
        const inline = line.replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
        if (inline) {
          formulaLines.push(inline);
        }
      } else {
        const inline = line.replace(/\$\$$/, '').trim();
        if (inline) {
          formulaLines.push(inline);
        }
        flushFormula();
        inFormula = false;
      }
      continue;
    }

    if (inFormula) {
      if (line) {
        formulaLines.push(line);
      }
      continue;
    }

    if (!line || line.startsWith('![')) {
      flushTable();
      continue;
    }

    const storyHeading = /^#{2,3}\s+(.+)$/.exec(line);
    if (storyHeading) {
      flushTable();
      current = { title: storyHeading[1].trim(), paragraphs: [] };
      stories.push(current);
      continue;
    }

    if (line.startsWith('|')) {
      tableLines.push(line);
      continue;
    }

    flushTable();

    if (current && !line.startsWith('#')) {
      pushToCurrent(normalizeContentLine(line));
    }
  }

  if (inCodeFence) {
    pushToCurrent(formatCodeBlock(codeLanguage, codeLines));
  }
  flushTable();
  flushFormula();

  return stories.filter((story) => story.title || story.paragraphs.length > 0);
}

function collectParagraphs(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const paragraphs: string[] = [];
  let currentLines: string[] = [];
  let inCodeFence = false;
  let codeLanguage = '';
  let codeLines: string[] = [];
  let tableLines: string[] = [];
  let formulaLines: string[] = [];
  let inFormula = false;

  function flushCurrent() {
    if (currentLines.length > 0) {
      paragraphs.push(currentLines.join(''));
      currentLines = [];
    }
  }

  function flushTable() {
    const table = formatTable(tableLines);
    if (table) {
      paragraphs.push(table);
    }
    tableLines = [];
  }

  function flushFormula() {
    if (formulaLines.length > 0) {
      paragraphs.push(`Formula: ${formulaLines.join(' ')}`);
    }
    formulaLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      if (!inCodeFence) {
        flushCurrent();
        flushTable();
        flushFormula();
        inCodeFence = true;
        codeLanguage = line.replace(/^```/, '').trim();
        codeLines = [];
      } else {
        paragraphs.push(formatCodeBlock(codeLanguage, codeLines));
        inCodeFence = false;
        codeLanguage = '';
        codeLines = [];
      }
      continue;
    }

    if (inCodeFence) {
      codeLines.push(rawLine);
      continue;
    }

    if (line.startsWith('$$')) {
      flushCurrent();
      flushTable();
      if (!inFormula) {
        inFormula = true;
        const inline = line.replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
        if (inline) {
          formulaLines.push(inline);
        }
      } else {
        const inline = line.replace(/\$\$$/, '').trim();
        if (inline) {
          formulaLines.push(inline);
        }
        flushFormula();
        inFormula = false;
      }
      continue;
    }

    if (inFormula) {
      if (line) {
        formulaLines.push(line);
      }
      continue;
    }

    if (!line) {
      flushCurrent();
      flushTable();
      continue;
    }

    if (line.startsWith('![')) {
      flushCurrent();
      flushTable();
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      flushCurrent();
      flushTable();
      continue;
    }

    if (line.startsWith('|')) {
      flushCurrent();
      tableLines.push(line);
      continue;
    }

    flushTable();
    const normalized = normalizeContentLine(line);
    if (normalized) {
      currentLines.push(normalized);
    }
  }

  if (inCodeFence) {
    paragraphs.push(formatCodeBlock(codeLanguage, codeLines));
  }
  flushCurrent();
  flushTable();
  flushFormula();

  return paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
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

function normalizeContentLine(line: string): string {
  if (/^[-:| ]{3,}$/.test(line)) {
    return '';
  }
  if (/^[-*+]\s+\[[ xX]\]\s+/.test(line)) {
    const checked = /^[-*+]\s+\[[xX]\]/.test(line);
    return `Task ${checked ? 'done' : 'open'}: ${stripMarkdown(line.replace(/^[-*+]\s+\[[ xX]\]\s+/, ''))}`;
  }
  if (/^[-*+]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
    return `Item: ${stripMarkdown(line)}`;
  }
  if (line.startsWith('>')) {
    return `Quote: ${stripMarkdown(line)}`;
  }
  return stripMarkdown(line);
}

function formatCodeBlock(language: string, lines: string[]): string {
  const code = lines.map((line) => line.trim()).filter(Boolean).join(' ');
  const suffix = language ? ` (${language})` : '';
  return code ? `Code block${suffix}: ${code}` : `Code block${suffix}`;
}

function formatTable(lines: string[]): string {
  const rows = lines
    .filter((line) => !/^\|?\s*[-:| ]+\s*\|?$/.test(line))
    .map((line) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean)
        .join(' / '),
    )
    .filter(Boolean);

  return rows.length > 0 ? `Table: ${rows.join('; ')}` : '';
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
