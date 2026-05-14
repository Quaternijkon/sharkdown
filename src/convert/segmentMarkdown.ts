export interface SegmentOptions {
  maxChars: number;
}

export interface MarkdownCardSegment {
  index: number;
  title: string;
  markdown: string;
  charCount: number;
  warnings: Array<'too-long' | 'empty-title'>;
}

export interface MarkdownSegmentationResult {
  cards: MarkdownCardSegment[];
  sourceCharCount: number;
}

function extractTitle(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

function toCard(markdown: string, index: number, options: SegmentOptions): MarkdownCardSegment {
  const normalized = markdown.trim();
  const title = extractTitle(normalized, `卡片 ${index + 1}`);
  const warnings: MarkdownCardSegment['warnings'] = [];

  if (normalized.length > options.maxChars) {
    warnings.push('too-long');
  }
  if (!/^#{1,3}\s+.+$/m.test(normalized)) {
    warnings.push('empty-title');
  }

  return {
    index,
    title,
    markdown: normalized,
    charCount: normalized.length,
    warnings,
  };
}

export function segmentMarkdownForCards(markdown: string, options: SegmentOptions): MarkdownSegmentationResult {
  const explicit = markdown
    .split(/\n-{3,}\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts =
    explicit.length > 1
      ? explicit
      : markdown
          .split(/(?=^##\s+)/m)
          .map((part) => part.trim())
          .filter(Boolean);

  return {
    cards: parts.map((part, index) => toCard(part, index, options)),
    sourceCharCount: markdown.length,
  };
}
