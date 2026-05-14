import type { ConvertArtifact, ConvertTargetId } from './artifact';
import { createTextArtifact } from './artifact';

const UNSAFE_URL_PATTERN = /^\s*javascript:/i;

export function normalizeHtmlForTarget(html: string, targetId: ConvertTargetId): string {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('script, iframe, object, embed').forEach((node) => node.remove());

  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && UNSAFE_URL_PATTERN.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
      if (targetId === 'email' && name === 'class') {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return template.innerHTML.trim();
}

export function createHtmlFragmentArtifact(input: {
  html: string;
  title: string;
  targetId: ConvertTargetId;
  includesLocalAssets: boolean;
}): ConvertArtifact {
  const title = input.title.trim() || 'Untitled';

  return createTextArtifact({
    kind: 'html-fragment',
    fileName: `${toSafeFileStem(title)}.html`,
    mimeType: 'text/html;charset=utf-8',
    text: normalizeHtmlForTarget(input.html, input.targetId),
    title,
    targetId: input.targetId,
    includesSourceMarkdown: false,
    includesLocalAssets: input.includesLocalAssets,
  });
}

function toSafeFileStem(value: string): string {
  const safe = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || 'sharkdown';
}
