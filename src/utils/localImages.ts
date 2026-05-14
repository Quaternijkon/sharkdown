export const LOCAL_IMAGE_PROTOCOL = 'local-image://';

export interface LocalImageReference {
  id: string;
  fileName: string;
}

export interface LocalImageAsset extends LocalImageReference {
  blob: Blob;
  type: string;
  size: number;
  updatedAt: number;
}

const DB_NAME = 'sharkdown-local-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export function sanitizeImageFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[\][()#<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'image';
}

export function createLocalImageMarkdown(reference: LocalImageReference): string {
  const safeName = sanitizeImageFileName(reference.fileName);
  return `![${safeName}](${LOCAL_IMAGE_PROTOCOL}${encodeURIComponent(reference.id)}/${encodeURIComponent(safeName)})`;
}

export function parseLocalImageReference(src: string | undefined): LocalImageReference | null {
  if (!src?.startsWith(LOCAL_IMAGE_PROTOCOL)) {
    return null;
  }

  const body = src.slice(LOCAL_IMAGE_PROTOCOL.length);
  const slashIndex = body.indexOf('/');
  if (slashIndex <= 0) {
    return null;
  }

  return {
    id: decodeURIComponent(body.slice(0, slashIndex)),
    fileName: decodeURIComponent(body.slice(slashIndex + 1)),
  };
}

export async function saveLocalImageAsset(file: File): Promise<LocalImageReference> {
  const id = createLocalImageId();
  const fileName = sanitizeImageFileName(file.name);
  const asset: LocalImageAsset = {
    id,
    fileName,
    blob: file,
    type: file.type || 'application/octet-stream',
    size: file.size,
    updatedAt: Date.now(),
  };

  await putAsset(asset);
  return { id, fileName };
}

export async function getLocalImageAsset(id: string): Promise<LocalImageAsset | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.addEventListener('success', () => resolve((request.result as LocalImageAsset | undefined) ?? null));
    request.addEventListener('error', () => reject(new Error('本地图片读取失败。')));
  });
}

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(new Error('本地图片读取失败。')));
    reader.readAsDataURL(blob);
  });
}

function createLocalImageId(): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `img_${Date.now().toString(36)}_${Array.from(random, (part) => part.toString(36)).join('')}`;
}

async function putAsset(asset: LocalImageAsset): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(asset);
    request.addEventListener('success', () => resolve());
    request.addEventListener('error', () => reject(new Error('本地图片保存失败。')));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('当前浏览器不支持本地图片资产库。'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(new Error('本地图片资产库打开失败。')));
  });
}
