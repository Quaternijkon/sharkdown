import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';

import type { ConvertArtifact } from '../convert/artifact';
import { createBatchManifest, createBatchZipBlob } from './batchPackage';

function artifact(fileName: string, kind: ConvertArtifact['kind'], size: number): ConvertArtifact {
  return {
    id: fileName,
    kind,
    fileName,
    mimeType: 'text/plain',
    size,
    text: 'x',
    metadata: {
      title: 'Doc',
      targetId: 'generic',
      includesSourceMarkdown: false,
      includesLocalAssets: false,
      createdAt: '2026-05-15T00:00:00.000Z',
      appVersion: '0.2.0',
    },
  };
}

describe('batch export package', () => {
  it('creates a serializable manifest for multiple artifacts', () => {
    const manifest = createBatchManifest({
      title: 'Doc',
      targetId: 'xiaohongshu',
      artifacts: [artifact('card-1.png', 'png', 100), artifact('doc.pdf', 'pdf', 200)],
      createdAt: '2026-05-15T00:00:00.000Z',
      appVersion: '0.2.0',
    });

    expect(manifest.files.map((file) => file.name)).toEqual(['card-1.png', 'doc.pdf']);
    expect(manifest.totalSize).toBe(300);
  });

  it('creates an offline zip blob with artifacts and a manifest', async () => {
    const artifacts = [artifact('doc.md', 'markdown', 6)];
    const manifest = createBatchManifest({
      title: 'Doc',
      targetId: 'github',
      artifacts,
      createdAt: '2026-05-15T00:00:00.000Z',
      appVersion: '0.2.0',
    });

    const blob = await createBatchZipBlob({ manifest, artifacts });
    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));

    expect(blob.type).toBe('application/zip');
    expect(Object.keys(archive)).toEqual(expect.arrayContaining(['manifest.json', 'doc.md']));
    expect(JSON.parse(strFromU8(archive['manifest.json'])).title).toBe('Doc');
  });
});
