export type ShareIssueCode =
  | 'local-images'
  | 'remote-images'
  | 'raw-html'
  | 'sensitive-content'
  | 'url-too-long'
  | 'document-large';

export interface SharePrivacyIssue {
  code: ShareIssueCode;
  severity: 'info' | 'warning' | 'danger';
  message: string;
}

export interface SharePrivacyReport {
  summary: {
    localImages: number;
    remoteImages: number;
    rawHtmlBlocks: number;
    sensitiveMatches: number;
    characters: number;
  };
  issues: SharePrivacyIssue[];
  canUseUrlShare: boolean;
}

export function scanMarkdownForShare(
  markdown: string,
  options: { encodedUrlLength?: number } = {},
): SharePrivacyReport {
  const localImages = countMatches(markdown, /!\[[^\]]*]\(\s*local-image:\/\/[^)]+?\s*\)/g);
  const remoteImages = countMatches(markdown, /!\[[^\]]*]\(\s*https?:\/\/[^)]+?\s*\)/g);
  const rawHtmlBlocks = countMatches(markdown, /<[a-z][\w:-]*(?:\s+[^>]*)?>/gi);
  const sensitiveMatches =
    countMatches(markdown, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) +
    countMatches(markdown, /(?:\+?86[-\s]?)?1[3-9]\d{9}/g) +
    countMatches(markdown, /\b(?:token|secret|api[_-]?key|password|sk)[\w-]*\s*[=:]\s*[\w-]{16,}/gi);

  const issues: SharePrivacyIssue[] = [];
  if (localImages > 0) {
    issues.push({
      code: 'local-images',
      severity: 'warning',
      message: '包含本地图片；轻量链接无法携带图片，请使用 .sharkdown 或自包含 HTML。',
    });
  }
  if (remoteImages > 0) {
    issues.push({
      code: 'remote-images',
      severity: 'info',
      message: '包含远程图片；接收者打开时可能访问外部资源。',
    });
  }
  if (rawHtmlBlocks > 0) {
    issues.push({
      code: 'raw-html',
      severity: 'warning',
      message: '包含 raw HTML；导出前请确认目标平台是否允许这些标签。',
    });
  }
  if (sensitiveMatches > 0) {
    issues.push({
      code: 'sensitive-content',
      severity: 'danger',
      message: '疑似包含邮箱、手机号或密钥片段；分享前建议复核。',
    });
  }
  if ((options.encodedUrlLength ?? 0) > 1800) {
    issues.push({
      code: 'url-too-long',
      severity: 'warning',
      message: 'URL 分享链接可能过长，建议改用文件交付。',
    });
  }
  if (markdown.length > 20_000) {
    issues.push({
      code: 'document-large',
      severity: 'info',
      message: '文档较长；导出 HTML 或 PDF 通常比轻量链接更稳定。',
    });
  }

  return {
    summary: {
      localImages,
      remoteImages,
      rawHtmlBlocks,
      sensitiveMatches,
      characters: markdown.length,
    },
    issues,
    canUseUrlShare: localImages === 0 && sensitiveMatches === 0 && (options.encodedUrlLength ?? 0) <= 1800,
  };
}

function countMatches(value: string, pattern: RegExp): number {
  return Array.from(value.matchAll(pattern)).length;
}
