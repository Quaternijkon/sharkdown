export interface SharePayload {
  version: 1;
  title: string;
  markdown: string;
  themeId: string;
}

export class SharePayloadError extends Error {
  constructor(message = '分享链接内容无法解析。') {
    super(message);
    this.name = 'SharePayloadError';
  }
}

export interface ShareUrlRisk {
  safe: boolean;
  reasons: string[];
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeSharePayload(encoded: string): SharePayload {
  try {
    const bytes = base64UrlToBytes(encoded);
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharePayload>;
    if (payload.version !== 1 || typeof payload.markdown !== 'string' || typeof payload.themeId !== 'string') {
      throw new SharePayloadError();
    }
    return {
      version: 1,
      title: typeof payload.title === 'string' ? payload.title : 'Shared Markdown',
      markdown: payload.markdown,
      themeId: payload.themeId,
    };
  } catch (err) {
    if (err instanceof SharePayloadError) {
      throw err;
    }
    throw new SharePayloadError();
  }
}

export function createShareUrl(baseUrl: string, payload: SharePayload): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}#/share?payload=${encodeSharePayload(payload)}`;
}

export function readSharePayloadFromHash(hash: string): SharePayload | null {
  const normalized = hash.replace(/^#\/?/, '');
  if (!normalized.startsWith('share?')) {
    return null;
  }
  const query = normalized.slice(normalized.indexOf('?') + 1);
  const encoded = new URLSearchParams(query).get('payload');
  return encoded ? decodeSharePayload(encoded) : null;
}

export function measureShareUrlRisk(input: { markdown: string; encodedLength: number }): ShareUrlRisk {
  const reasons: string[] = [];
  if (input.encodedLength > 1800) {
    reasons.push('链接过长，聊天工具或浏览器可能截断。');
  }
  if (input.markdown.includes('local-image://')) {
    reasons.push('轻量链接不能携带本地图片，请改用 .sharkdown 或 HTML。');
  }
  return {
    safe: reasons.length === 0,
    reasons,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
