import { describe, expect, it } from 'vitest';

import { getServiceWorkerUrl, shouldRegisterServiceWorker } from './registerServiceWorker';

describe('service worker registration helpers', () => {
  it('resolves service worker path under the configured Vite base', () => {
    expect(getServiceWorkerUrl('/')).toBe('/sw.js');
    expect(getServiceWorkerUrl('/sharkdown/')).toBe('/sharkdown/sw.js');
  });

  it('requires browser service worker support', () => {
    expect(shouldRegisterServiceWorker({ serviceWorker: {} })).toBe(true);
    expect(shouldRegisterServiceWorker({})).toBe(false);
  });
});
