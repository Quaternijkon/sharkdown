import { APP_VERSION } from '../version';

export type ConvertArtifactKind =
  | 'png'
  | 'jpeg'
  | 'webp'
  | 'svg'
  | 'pdf'
  | 'html'
  | 'html-fragment'
  | 'markdown'
  | 'plain-text'
  | 'rich-text'
  | 'zip'
  | 'sharkdown';

export type ConvertTargetId =
  | 'generic'
  | 'wechat'
  | 'xiaohongshu'
  | 'douyin'
  | 'zhihu'
  | 'github'
  | 'notion'
  | 'email'
  | 'slides'
  | 'print';

export interface ConvertArtifactMetadata {
  title: string;
  targetId: ConvertTargetId;
  includesSourceMarkdown: boolean;
  includesLocalAssets: boolean;
  createdAt: string;
  appVersion: string;
}

export interface ConvertArtifact {
  id: string;
  kind: ConvertArtifactKind;
  fileName: string;
  mimeType: string;
  size: number;
  blob?: Blob;
  text?: string;
  metadata: ConvertArtifactMetadata;
}

export interface CreateTextArtifactInput {
  kind: Extract<ConvertArtifactKind, 'html' | 'html-fragment' | 'markdown' | 'plain-text' | 'rich-text'>;
  fileName: string;
  mimeType: string;
  text: string;
  title: string;
  targetId: ConvertTargetId;
  includesSourceMarkdown: boolean;
  includesLocalAssets?: boolean;
  now?: Date;
  appVersion?: string;
}

export interface CreateBinaryArtifactInput {
  kind: Exclude<ConvertArtifactKind, 'html' | 'html-fragment' | 'markdown' | 'plain-text' | 'rich-text'>;
  fileName: string;
  mimeType: string;
  blob: Blob;
  title: string;
  targetId: ConvertTargetId;
  includesSourceMarkdown?: boolean;
  includesLocalAssets?: boolean;
  now?: Date;
  appVersion?: string;
}

export function estimateArtifactSize(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function isBinaryArtifact(value: Partial<Pick<ConvertArtifact, 'blob' | 'text'>>): boolean {
  return value.blob instanceof Blob && typeof value.text !== 'string';
}

export function createTextArtifact(input: CreateTextArtifactInput): ConvertArtifact {
  const createdAt = (input.now ?? new Date()).toISOString();

  return {
    id: `${input.kind}-${createdAt}`,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: estimateArtifactSize(input.text),
    text: input.text,
    metadata: {
      title: input.title,
      targetId: input.targetId,
      includesSourceMarkdown: input.includesSourceMarkdown,
      includesLocalAssets: input.includesLocalAssets ?? false,
      createdAt,
      appVersion: input.appVersion ?? APP_VERSION,
    },
  };
}

export function createBinaryArtifact(input: CreateBinaryArtifactInput): ConvertArtifact {
  const createdAt = (input.now ?? new Date()).toISOString();

  return {
    id: `${input.kind}-${createdAt}`,
    kind: input.kind,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.blob.size,
    blob: input.blob,
    metadata: {
      title: input.title,
      targetId: input.targetId,
      includesSourceMarkdown: input.includesSourceMarkdown ?? false,
      includesLocalAssets: input.includesLocalAssets ?? false,
      createdAt,
      appVersion: input.appVersion ?? APP_VERSION,
    },
  };
}
