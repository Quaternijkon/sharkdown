import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('GitHub Pages custom domain deployment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('builds GitHub Actions output for the custom domain root', async () => {
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.resetModules();

    const { default: viteConfig } = await import('../../vite.config');

    expect(viteConfig.base).toBe('/');
  });

  it('publishes the custom domain CNAME with the Pages artifact', () => {
    const cnamePath = join(process.cwd(), 'public', 'CNAME');

    expect(existsSync(cnamePath)).toBe(true);
    expect(readFileSync(cnamePath, 'utf8').trim()).toBe('sharkdown.quaternijkon.online');
  });
});
