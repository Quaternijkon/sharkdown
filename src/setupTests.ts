import '@testing-library/jest-dom/vitest';

if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
    },
  });
}
