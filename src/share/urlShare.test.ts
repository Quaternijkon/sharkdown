import { describe, expect, it } from 'vitest';

import {
  SharePayloadError,
  createShareUrl,
  decodeSharePayload,
  encodeSharePayload,
  measureShareUrlRisk,
  readSharePayloadFromHash,
} from './urlShare';

describe('URL fragment sharing', () => {
  it('round-trips markdown and settings through a base64url payload', () => {
    const payload = encodeSharePayload({
      version: 1,
      title: 'Short note',
      markdown: '# Short note\n\n跨设备分享。',
      themeId: 'gpt',
    });

    expect(payload).not.toContain('+');
    expect(payload).not.toContain('/');
    expect(payload).not.toContain('=');
    expect(decodeSharePayload(payload)).toEqual({
      version: 1,
      title: 'Short note',
      markdown: '# Short note\n\n跨设备分享。',
      themeId: 'gpt',
    });
  });

  it('creates and reads hash URLs without sending content to a server path', () => {
    const url = createShareUrl('https://example.com/sharkdown/', {
      version: 1,
      title: 'Note',
      markdown: 'Hello',
      themeId: 'claude',
    });

    expect(url).toMatch(/^https:\/\/example\.com\/sharkdown\/#\/share\?payload=/);
    expect(readSharePayloadFromHash(new URL(url).hash)?.markdown).toBe('Hello');
  });

  it('reports risky payload sizes and local asset references', () => {
    const risk = measureShareUrlRisk({
      markdown: `![x](local-image://img_1/a.png)\n${'x'.repeat(2200)}`,
      encodedLength: 2300,
    });

    expect(risk.safe).toBe(false);
    expect(risk.reasons).toContain('链接过长，聊天工具或浏览器可能截断。');
    expect(risk.reasons).toContain('轻量链接不能携带本地图片，请改用 .sharkdown 或 HTML。');
  });

  it('throws a typed error for invalid payloads', () => {
    expect(() => decodeSharePayload('not-json')).toThrow(SharePayloadError);
  });
});
