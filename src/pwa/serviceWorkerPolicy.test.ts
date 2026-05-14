import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const serviceWorkerSource = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

describe('service worker cache policy', () => {
  it('uses a new cache version for the production shell', () => {
    expect(serviceWorkerSource).toContain("const CACHE_NAME = 'sharkdown-static-v3'");
  });

  it('serves page navigations network-first to avoid stale blank screens', () => {
    expect(serviceWorkerSource).toContain("request.mode === 'navigate'");
    expect(serviceWorkerSource).toContain('cacheShellResponse(request, response)');
  });
});
