export interface StandaloneHtmlInput {
  title: string;
  renderedHtml: string;
  themeClassName: string;
  themeVars: Record<string, string>;
  markdown?: string;
  includeSourceMarkdown: boolean;
  generatedAt?: string;
}

export function createStandaloneHtml(input: StandaloneHtmlInput): string {
  const title = input.title.trim() || 'Sharkdown Document';
  const escapedTitle = escapeHtml(title);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const themeStyle = Object.entries(input.themeVars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  const sourceAttribute =
    input.includeSourceMarkdown && input.markdown !== undefined
      ? ` data-sharkdown-source="${escapeAttribute(encodeURIComponent(JSON.stringify({ markdown: input.markdown })))}"`
      : '';

  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapedTitle}</title>`,
    '<style>',
    ':root{color-scheme:light;}',
    'body{margin:0;background:#f3f4f6;color:#111827;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '.shell{max-width:980px;margin:0 auto;padding:40px 18px 56px;}',
    '.sharkdown-document{box-sizing:border-box;margin:0 auto;background:var(--preview-bg,#fff);color:var(--preview-text,#111);font-family:var(--preview-font-body,Georgia,serif);line-height:1.72;padding:48px;border-radius:12px;box-shadow:0 18px 60px rgba(15,23,42,.12);}',
    '.sharkdown-document img{max-width:100%;height:auto;}',
    '.sharkdown-document pre{overflow:auto;padding:16px;border-radius:8px;background:#111827;color:#f8fafc;}',
    '.sharkdown-document table{width:100%;border-collapse:collapse;}',
    '.sharkdown-document th,.sharkdown-document td{border:1px solid rgba(148,163,184,.45);padding:8px 10px;}',
    '.meta{margin:18px auto 0;max-width:980px;color:#64748b;font-size:12px;line-height:1.6;}',
    '@media print{body{background:#fff}.shell{padding:0}.sharkdown-document{box-shadow:none;border-radius:0}.meta{display:none}}',
    '</style>',
    '</head>',
    '<body>',
    '<main class="shell">',
    `<article class="sharkdown-document ${escapeAttribute(input.themeClassName)}" style="${escapeAttribute(themeStyle)}"${sourceAttribute}>`,
    input.renderedHtml,
    '</article>',
    `<p class="meta">此文件由 Sharkdown 离线生成，生成时间 ${escapeHtml(generatedAt)}。内容不会自动上传。</p>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

export function createStandaloneHtmlBlob(input: StandaloneHtmlInput): Blob {
  return new Blob([createStandaloneHtml(input)], { type: 'text/html;charset=utf-8' });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
