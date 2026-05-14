import { scanMarkdownForShare } from '../share/privacyScan';
import type { ConvertTargetId } from './artifact';

export type ConvertPreflightSeverity = 'ok' | 'info' | 'warning' | 'error';

export interface ConvertPreflightItem {
  code:
    | 'card-text-too-long'
    | 'remote-image'
    | 'local-assets-large'
    | 'wide-table'
    | 'raw-html'
    | 'formula-check'
    | 'mermaid-check'
    | 'sensitive-content';
  severity: Exclude<ConvertPreflightSeverity, 'ok'>;
  message: string;
}

export interface ConvertPreflightInput {
  markdown: string;
  renderedHtml: string;
  targetId: ConvertTargetId;
  estimatedLocalAssetBytes: number;
}

export interface ConvertPreflightResult {
  severity: ConvertPreflightSeverity;
  items: ConvertPreflightItem[];
}

function highestSeverity(items: ConvertPreflightItem[]): ConvertPreflightSeverity {
  if (items.some((item) => item.severity === 'error')) {
    return 'error';
  }
  if (items.some((item) => item.severity === 'warning')) {
    return 'warning';
  }
  if (items.some((item) => item.severity === 'info')) {
    return 'info';
  }
  return 'ok';
}

export function runConvertPreflight(input: ConvertPreflightInput): ConvertPreflightResult {
  const items: ConvertPreflightItem[] = [];
  const privacy = scanMarkdownForShare(input.markdown);
  const compactCardTarget = input.targetId === 'xiaohongshu' || input.targetId === 'douyin';

  if (compactCardTarget && input.markdown.length > 700) {
    items.push({
      code: 'card-text-too-long',
      severity: 'warning',
      message: '当前内容对于单张社交卡片过长，建议拆成轮播卡片。',
    });
  }

  if (
    privacy.summary.remoteImages > 0 ||
    /<img[^>]+src=(["'])https?:\/\//i.test(input.renderedHtml) ||
    /<img[^>]+src=https?:\/\//i.test(input.renderedHtml)
  ) {
    items.push({
      code: 'remote-image',
      severity: 'warning',
      message: '包含远程图片，离线导出和 canvas 导出可能失败。',
    });
  }

  if (input.estimatedLocalAssetBytes > 20 * 1024 * 1024) {
    items.push({
      code: 'local-assets-large',
      severity: 'info',
      message: '本地图片体积较大，批量导出可能需要更长时间。',
    });
  }

  if (/<table[\s>]/i.test(input.renderedHtml)) {
    items.push({
      code: 'wide-table',
      severity: 'info',
      message: '表格在窄屏卡片或 PDF 中可能横向溢出。',
    });
  }

  if (privacy.summary.rawHtmlBlocks > 0) {
    items.push({
      code: 'raw-html',
      severity: 'info',
      message: 'Markdown 包含原始 HTML，目标平台可能会过滤。',
    });
  }

  if (/\$\$?/.test(input.markdown)) {
    items.push({
      code: 'formula-check',
      severity: 'info',
      message: '包含公式，导出前应确认 KaTeX 渲染完成。',
    });
  }

  if (/```mermaid|^graph\s|^sequenceDiagram/m.test(input.markdown)) {
    items.push({
      code: 'mermaid-check',
      severity: 'info',
      message: '包含 Mermaid 图表，导出前应确认图表已经静态渲染。',
    });
  }

  if (privacy.summary.sensitiveMatches > 0) {
    items.push({
      code: 'sensitive-content',
      severity: 'error',
      message: '疑似包含邮箱、手机号或密钥片段，转换分享前需要复核。',
    });
  }

  return {
    severity: highestSeverity(items),
    items,
  };
}
