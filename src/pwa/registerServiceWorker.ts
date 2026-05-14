export function getServiceWorkerUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalized}sw.js`;
}

export function shouldRegisterServiceWorker(navigatorLike: Pick<Navigator, 'serviceWorker'> | object): boolean {
  return 'serviceWorker' in navigatorLike;
}

export function registerServiceWorker(baseUrl = import.meta.env.BASE_URL): void {
  if (!shouldRegisterServiceWorker(navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(getServiceWorkerUrl(baseUrl))
      .catch((error: unknown) => {
        console.info('Sharkdown service worker registration skipped.', error);
      });
  });
}
