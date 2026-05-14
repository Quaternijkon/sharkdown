import { describe, expect, it } from 'vitest';

import { scanMarkdownForShare } from './privacyScan';

describe('share privacy scan', () => {
  it('detects content that changes how a share artifact should be delivered', () => {
    const report = scanMarkdownForShare(
      [
        '# Confidential',
        '![local](local-image://img_1/chart.png)',
        '![remote](https://example.com/chart.png)',
        '<section>raw html</section>',
        'Contact me at user@example.com or 13800138000.',
        'token = sk-1234567890abcdef1234567890abcdef',
      ].join('\n'),
      { encodedUrlLength: 2100 },
    );

    expect(report.summary.localImages).toBe(1);
    expect(report.summary.remoteImages).toBe(1);
    expect(report.summary.rawHtmlBlocks).toBe(1);
    expect(report.summary.sensitiveMatches).toBeGreaterThanOrEqual(3);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'local-images',
        'remote-images',
        'raw-html',
        'sensitive-content',
        'url-too-long',
      ]),
    );
    expect(report.canUseUrlShare).toBe(false);
  });

  it('marks short plain markdown as safe for lightweight URL sharing', () => {
    const report = scanMarkdownForShare('# Public note\n\nJust text.', { encodedUrlLength: 80 });

    expect(report.issues).toHaveLength(0);
    expect(report.canUseUrlShare).toBe(true);
  });
});
