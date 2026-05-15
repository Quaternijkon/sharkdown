export type MarkdownFormatCommand =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inline-code'
  | 'code-block'
  | 'h2'
  | 'quote'
  | 'unordered-list'
  | 'ordered-list'
  | 'task-list'
  | 'link'
  | 'table';

export interface MarkdownFormatResult {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
}

export function applyMarkdownFormat(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  command: MarkdownFormatCommand,
): MarkdownFormatResult {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const selected = markdown.slice(start, end);

  if (command === 'bold') {
    return wrapSelection(markdown, start, end, selected || '加粗文本', '**', '**');
  }
  if (command === 'italic') {
    return wrapSelection(markdown, start, end, selected || '斜体文本', '*', '*');
  }
  if (command === 'strikethrough') {
    return wrapSelection(markdown, start, end, selected || '删除线文本', '~~', '~~');
  }
  if (command === 'inline-code') {
    return wrapSelection(markdown, start, end, selected || 'code', '`', '`');
  }
  if (command === 'code-block') {
    return wrapSelection(markdown, start, end, selected || 'code', '```\n', '\n```');
  }
  if (command === 'link') {
    return wrapSelection(markdown, start, end, selected || '链接文字', '[', '](https://example.com)');
  }
  if (command === 'table') {
    return replaceSelection(markdown, start, end, selected || '| 列 A | 列 B |\n|---|---|\n| 内容 | 内容 |');
  }

  return transformSelectedLines(markdown, start, end, (line, index) => {
    const stripped = line.replace(/^(\s*)(#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+|- \[[ xX]\]\s+)?/, '$1');
    const indent = /^(\s*)/.exec(line)?.[1] ?? '';
    const body = stripped.trimStart() || '文本';
    if (command === 'h2') {
      return `${indent}## ${body}`;
    }
    if (command === 'quote') {
      return `${indent}> ${body}`;
    }
    if (command === 'unordered-list') {
      return `${indent}- ${body}`;
    }
    if (command === 'ordered-list') {
      return `${indent}${index + 1}. ${body}`;
    }
    if (command === 'task-list') {
      return `${indent}- [ ] ${body}`;
    }
    return line;
  });
}

function wrapSelection(
  markdown: string,
  start: number,
  end: number,
  selected: string,
  prefix: string,
  suffix: string,
): MarkdownFormatResult {
  return replaceSelection(markdown, start, end, `${prefix}${selected}${suffix}`, prefix.length, prefix.length + selected.length);
}

function replaceSelection(
  markdown: string,
  start: number,
  end: number,
  replacement: string,
  innerStart = 0,
  innerEnd = replacement.length,
): MarkdownFormatResult {
  return {
    markdown: `${markdown.slice(0, start)}${replacement}${markdown.slice(end)}`,
    selectionStart: start + innerStart,
    selectionEnd: start + innerEnd,
  };
}

function transformSelectedLines(
  markdown: string,
  start: number,
  end: number,
  transform: (line: string, index: number) => string,
): MarkdownFormatResult {
  const lineStart = markdown.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextLineBreak = markdown.indexOf('\n', end);
  const lineEnd = nextLineBreak === -1 ? markdown.length : nextLineBreak;
  const lines = markdown.slice(lineStart, lineEnd).split('\n');
  const replacement = lines.map(transform).join('\n');
  return replaceSelection(markdown, lineStart, lineEnd, replacement, 0, replacement.length);
}
