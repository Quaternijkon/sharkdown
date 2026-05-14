import type { ConvertTargetId } from '../convert/artifact';
import { normalizeHtmlForTarget } from '../convert/htmlFragment';

export interface RichClipboardPayload {
  html: string;
  plainText: string;
}

export async function copyMarkdown(markdown: string): Promise<void> {
  await navigator.clipboard.writeText(markdown);
}

export async function copyPlainText(markdown: string): Promise<void> {
  await navigator.clipboard.writeText(markdownToPlainText(markdown));
}

export async function copyRichHtml(html: string, plainText: string): Promise<void> {
  await copyRichClipboardPayload({ html, plainText });
}

export async function copyRichHtmlForTarget(
  html: string,
  plainText: string,
  targetId: ConvertTargetId,
): Promise<void> {
  await copyRichClipboardPayload({
    html: normalizeHtmlForTarget(html, targetId),
    plainText,
  });
}

export async function copyRichClipboardPayload(payload: RichClipboardPayload): Promise<void> {
  const ClipboardItemCtor = globalThis.ClipboardItem;
  if (ClipboardItemCtor && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItemCtor({
        'text/html': new Blob([payload.html], { type: 'text/html' }),
        'text/plain': new Blob([payload.plainText], { type: 'text/plain' }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(payload.plainText);
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|\n?```/g, ''))
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
