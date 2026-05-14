import type { DocumentState } from '../types';
import { APP_VERSION } from '../version';
import {
  getLocalImageAsset,
  parseLocalImageReference,
  readBlobAsDataUrl,
  saveLocalImageAssetRecord,
  type LocalImageAsset,
} from '../utils/localImages';

export const SHARKDOWN_PROJECT_VERSION = 2;
export const SHARKDOWN_PROJECT_MIME = 'application/vnd.sharkdown.project+json';

export interface SharkdownProjectAsset {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

export interface SharkdownProjectManifest {
  format: 'sharkdown-project';
  version: typeof SHARKDOWN_PROJECT_VERSION;
  createdBy: 'Sharkdown';
  createdAt: string;
  title: string;
  appVersion: string;
  assetCount: number;
}

export interface SharkdownProjectPackage {
  manifest: SharkdownProjectManifest;
  markdown: string;
  state: DocumentState;
  assets: SharkdownProjectAsset[];
}

export interface CreateProjectPackageInput {
  title: string;
  markdown: string;
  state: DocumentState;
  assets?: SharkdownProjectAsset[];
  appVersion?: string;
  createdAt?: string;
}

export async function createProjectPackageBlob(input: CreateProjectPackageInput): Promise<Blob> {
  const assets = input.assets ?? (await collectLocalImageAssets(input.markdown));
  const payload: SharkdownProjectPackage = {
    manifest: {
      format: 'sharkdown-project',
      version: SHARKDOWN_PROJECT_VERSION,
      createdBy: 'Sharkdown',
      createdAt: input.createdAt ?? new Date().toISOString(),
      title: input.title.trim() || 'Untitled Sharkdown Document',
      appVersion: input.appVersion ?? APP_VERSION,
      assetCount: assets.length,
    },
    markdown: input.markdown,
    state: input.state,
    assets,
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: SHARKDOWN_PROJECT_MIME });
}

export async function parseProjectPackageFile(file: File | Blob): Promise<SharkdownProjectPackage> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('无法识别的 Sharkdown 工程包。');
  }

  if (!isProjectPackage(raw)) {
    throw new Error('无法识别的 Sharkdown 工程包。');
  }

  return raw;
}

export async function collectLocalImageAssets(markdown: string): Promise<SharkdownProjectAsset[]> {
  const references = new Map<string, { id: string; fileName: string }>();
  for (const match of markdown.matchAll(/local-image:\/\/[^\s)\]]+/g)) {
    const reference = parseLocalImageReference(match[0]);
    if (reference) {
      references.set(reference.id, reference);
    }
  }

  const assets: SharkdownProjectAsset[] = [];
  for (const reference of references.values()) {
    const asset = await getLocalImageAsset(reference.id);
    if (!asset) {
      continue;
    }
    assets.push({
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.type,
      size: asset.size,
      dataUrl: await readBlobAsDataUrl(asset.blob),
    });
  }
  return assets;
}

export async function restoreProjectAssets(assets: SharkdownProjectAsset[]): Promise<void> {
  await Promise.all(
    assets.map(async (asset) => {
      const blob = dataUrlToBlob(asset.dataUrl, asset.mimeType);
      const record: LocalImageAsset = {
        id: asset.id,
        fileName: asset.fileName,
        blob,
        type: asset.mimeType || blob.type || 'application/octet-stream',
        size: asset.size || blob.size,
        updatedAt: Date.now(),
      };
      await saveLocalImageAssetRecord(record);
    }),
  );
}

function isProjectPackage(value: unknown): value is SharkdownProjectPackage {
  const candidate = value as Partial<SharkdownProjectPackage> | undefined;
  return Boolean(
    candidate &&
      candidate.manifest?.format === 'sharkdown-project' &&
      candidate.manifest.version <= SHARKDOWN_PROJECT_VERSION &&
      typeof candidate.manifest.title === 'string' &&
      typeof candidate.markdown === 'string' &&
      typeof candidate.state === 'object' &&
      Array.isArray(candidate.assets),
  );
}

function dataUrlToBlob(dataUrl: string, fallbackType: string): Blob {
  const [header, payload] = dataUrl.split(',');
  if (!header || !payload || !header.startsWith('data:')) {
    throw new Error('工程包中的图片资产格式无效。');
  }
  const mimeType = /data:([^;]+)/.exec(header)?.[1] ?? fallbackType;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}
