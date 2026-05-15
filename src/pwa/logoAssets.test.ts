import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('application logo assets', () => {
  it('publishes the root logo image as the web app icon source', () => {
    expect(existsSync(join(process.cwd(), 'public', 'logo.png'))).toBe(true);
  });

  it('uses the logo image from HTML, manifest, and service worker shell cache', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const manifest = readFileSync(join(process.cwd(), 'public', 'manifest.webmanifest'), 'utf8');
    const serviceWorker = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

    expect(html).toContain('href="%BASE_URL%logo.png"');
    expect(manifest).toContain('"src": "logo.png"');
    expect(serviceWorker).toContain('logo.png');
  });
});
