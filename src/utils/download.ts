export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noreferrer';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function createExportFileName(extension: string, suffix?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `sharkdown-${timestamp}${suffix ? `-${suffix}` : ''}.${extension}`;
}
