export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(new Error('本地图片读取失败。')));
    reader.readAsDataURL(file);
  });
}

export function createImageMarkdown(fileName: string, dataUrl: string): string {
  const safeName = fileName.replace(/\]/g, '');
  return `![${safeName}](${dataUrl})`;
}
