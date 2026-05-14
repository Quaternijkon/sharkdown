import { strToU8, Zip, ZipPassThrough } from 'fflate';

import type { ConvertArtifact, ConvertTargetId } from '../convert/artifact';

export interface BatchManifestFile {
  name: string;
  kind: ConvertArtifact['kind'];
  mimeType: string;
  size: number;
}

export interface BatchManifest {
  format: 'sharkdown-batch-export';
  version: 1;
  title: string;
  targetId: ConvertTargetId;
  createdAt: string;
  appVersion: string;
  totalSize: number;
  files: BatchManifestFile[];
}

export function createBatchManifest(input: {
  title: string;
  targetId: ConvertTargetId;
  artifacts: ConvertArtifact[];
  createdAt: string;
  appVersion: string;
}): BatchManifest {
  return {
    format: 'sharkdown-batch-export',
    version: 1,
    title: input.title,
    targetId: input.targetId,
    createdAt: input.createdAt,
    appVersion: input.appVersion,
    totalSize: input.artifacts.reduce((sum, artifact) => sum + artifact.size, 0),
    files: input.artifacts.map((artifact) => ({
      name: artifact.fileName,
      kind: artifact.kind,
      mimeType: artifact.mimeType,
      size: artifact.size,
    })),
  };
}

export async function createBatchZipBlob(input: {
  manifest: BatchManifest;
  artifacts: ConvertArtifact[];
}): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let zipError: Error | null = null;
  const zip = new Zip((error, data) => {
    if (error) {
      zipError = error;
      return;
    }
    chunks.push(data);
  });

  addZipFile(zip, 'manifest.json', strToU8(JSON.stringify(input.manifest, null, 2)));

  for (const artifact of input.artifacts) {
    if (artifact.blob) {
      addZipFile(zip, artifact.fileName, new Uint8Array(await artifact.blob.arrayBuffer()));
    } else if (artifact.text !== undefined) {
      addZipFile(zip, artifact.fileName, strToU8(artifact.text));
    }
  }

  zip.end();
  if (zipError) {
    throw zipError;
  }

  return new Blob([toArrayBuffer(concatUint8Arrays(chunks))], { type: 'application/zip' });
}

function addZipFile(zip: Zip, fileName: string, bytes: Uint8Array): void {
  const file = new ZipPassThrough(fileName);
  zip.add(file);
  file.push(bytes, true);
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new Uint8Array(bytes.byteLength);
  output.set(bytes);
  return output.buffer;
}
