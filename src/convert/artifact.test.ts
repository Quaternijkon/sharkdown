import { describe, expect, it } from 'vitest';

import { createTextArtifact, estimateArtifactSize, isBinaryArtifact } from './artifact';

describe('convert artifacts', () => {
  it('creates text artifacts with stable metadata', () => {
    const artifact = createTextArtifact({
      kind: 'markdown',
      fileName: 'note.md',
      mimeType: 'text/markdown;charset=utf-8',
      text: '# Note',
      title: 'Note',
      targetId: 'github',
      includesSourceMarkdown: true,
      now: new Date('2026-05-15T00:00:00.000Z'),
    });

    expect(artifact.kind).toBe('markdown');
    expect(artifact.fileName).toBe('note.md');
    expect(artifact.size).toBeGreaterThan(0);
    expect(artifact.metadata.title).toBe('Note');
    expect(artifact.metadata.targetId).toBe('github');
    expect(artifact.metadata.includesSourceMarkdown).toBe(true);
    expect(artifact.metadata.createdAt).toBe('2026-05-15T00:00:00.000Z');
  });

  it('distinguishes binary and text artifacts', () => {
    expect(isBinaryArtifact({ kind: 'png', blob: new Blob(['x']) })).toBe(true);
    expect(isBinaryArtifact({ kind: 'html-fragment', text: '<p>x</p>' })).toBe(false);
  });

  it('estimates unicode text size as utf-8 bytes', () => {
    expect(estimateArtifactSize('中文')).toBe(6);
  });
});
